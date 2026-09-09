import { buildIssueId } from "../actionQueue";
import type { AssistantContext } from "./context";
import type { AssistantAnswer, AssistantEvidenceItem } from "./types";
import type { AssistantIntent } from "./intents";
import type { SeoActionQueueItem, SeoIssue } from "../types";

// STEP 8 Task 3/4/9 — every function here builds its answer text and
// evidence ONLY from fields already present on AssistantContext (itself
// built entirely from cached/persisted STEP 1-7 data — see context.ts).
// Nothing here invents a number, a URL, or a claim; where data doesn't
// exist, the text says so explicitly rather than guessing.

const MAX_ITEMS = 8;

function priorityRank(p: "high" | "medium" | "low"): number {
  return p === "high" ? 3 : p === "medium" ? 2 : 1;
}

function toEvidence(a: SeoActionQueueItem): AssistantEvidenceItem {
  return {
    url: a.page ?? undefined,
    metric: a.currentMetric,
    issue: a.issueType,
    reason: a.problem,
    recommendedAction: a.recommendedAction,
    actionId: a.id,
  };
}

function issueToEvidence(i: SeoIssue, actionById: Map<string, SeoActionQueueItem>, id: string): AssistantEvidenceItem {
  const action = actionById.get(id);
  return {
    url: i.page,
    metric: i.currentMetric,
    issue: i.type,
    reason: i.message,
    recommendedAction: action?.recommendedAction,
    actionId: action?.id,
  };
}

function gscCaveat(ctx: AssistantContext): string {
  return ctx.gscConnected ? "" : " Search Console is not connected, so this is based on on-page/crawl/technical evidence only, not real query data.";
}

function actionByIssueId(ctx: AssistantContext): Map<string, SeoActionQueueItem> {
  return new Map(ctx.actions.map((a) => [a.id, a]));
}

// --- pending-approvals (Task 5/6) ---
function pendingApprovals(ctx: AssistantContext): AssistantAnswer {
  const pending = ctx.actions.filter((a) => a.status === "pending" || a.status === "review-required");
  const top = [...pending].sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority)).slice(0, MAX_ITEMS);
  const text =
    pending.length === 0
      ? "There are no actions currently waiting for approval."
      : `${pending.length} action(s) are waiting for approval (status "review-required" or "pending"). Showing the ${top.length} highest-priority below. Nothing has been applied to the live site — every item requires your explicit approval first, per the existing approval workflow.`;
  return { intent: "pending-approvals", text, evidence: top.map(toEvidence), relatedActionIds: top.map((a) => a.id), gscUsed: false };
}

// --- history-changes (Task 12) ---
function historyChanges(ctx: AssistantContext): AssistantAnswer {
  const changes = ctx.dashboard.technicalSeo.changes;
  if (!changes || !changes.comparedAgainst) {
    return { intent: "history-changes", text: "No previous scan exists yet to compare against — this looks like the first recorded scan, so there's nothing to say improved or worsened.", evidence: [], relatedActionIds: [], gscUsed: false };
  }
  const parts = [
    `Compared to the scan on ${changes.comparedAgainst}: ${changes.newIssues.length} new issue(s), ${changes.resolvedIssues.length} resolved, ${changes.worseningIssues.length} worsening, ${changes.improvingIssues.length} improving.`,
    `Technical SEO score trend: ${changes.scoreTrend}${changes.previousTechnicalScore !== null ? ` (${changes.previousTechnicalScore} → ${changes.currentTechnicalScore})` : ""}.`,
  ];
  // STEP 10 Task 17 — layer in the newer report-to-report trends
  // (score/search/change-queue metrics) when at least one exists, so
  // "what changed since the last report?" answers with more than just
  // the technical-issue diff.
  const notableTrends = ctx.dashboard.monitoring.trends.filter((t) => t.direction === "improving" || t.direction === "declining");
  if (notableTrends.length > 0) {
    parts.push(`Other notable trends: ${notableTrends.map((t) => `${t.metric} ${t.direction} (${t.previous} → ${t.current})`).join("; ")}.`);
  }
  const evidence: AssistantEvidenceItem[] = [
    ...changes.newIssues.slice(0, 4).map((e) => ({ url: e.page ?? undefined, issue: e.type, reason: `New: ${e.message}` })),
    ...changes.resolvedIssues.slice(0, 4).map((e) => ({ url: e.page ?? undefined, issue: e.type, reason: `Resolved: ${e.message}` })),
    ...changes.worseningIssues.slice(0, 4).map((e) => ({ url: e.page ?? undefined, issue: e.type, reason: `Worsening: ${e.message} (${e.previousMagnitude} → ${e.currentMagnitude})` })),
  ];
  return { intent: "history-changes", text: parts.join(" "), evidence, relatedActionIds: [], gscUsed: false };
}

// --- seo-performance (Task 17: "How is my SEO performing?") ---
function seoPerformance(ctx: AssistantContext): AssistantAnswer {
  const monitoring = ctx.dashboard.monitoring;
  if (!monitoring.healthScore) {
    return { intent: "seo-performance", text: "No monitoring run has completed yet, so there's no SEO health score to report. Run a monitoring cycle first (/api/seo-agent/monitoring/run).", evidence: [], relatedActionIds: [], gscUsed: false };
  }
  const parts = [
    `SEO health score: ${monitoring.healthScore.score}/100.`,
    monitoring.healthScore.unavailableComponents.length > 0 ? `Not currently scoreable: ${monitoring.healthScore.unavailableComponents.join(", ")}.` : "",
    monitoring.alerts.filter((a) => a.severity === "critical").length > 0 ? `${monitoring.alerts.filter((a) => a.severity === "critical").length} critical alert(s) open.` : "No critical alerts are currently open.",
  ].filter(Boolean);
  const trendLine = monitoring.trends.find((t) => t.metric === "SEO Health Score");
  if (trendLine && trendLine.direction !== "unknown") {
    parts.push(`Trend: ${trendLine.direction} (previous: ${trendLine.previous}).`);
  }
  const evidence: AssistantEvidenceItem[] = monitoring.healthScore.factors.map((f) => ({ metric: f.factor, currentValue: `${f.contribution}/${f.weight}`, reason: f.explanation }));
  return { intent: "seo-performance", text: parts.join(" "), evidence, relatedActionIds: [], gscUsed: ctx.gscConnected };
}

// --- validation-check (Task 17: "Did my recent approved SEO change validate successfully?") ---
function validationCheck(ctx: AssistantContext): AssistantAnswer {
  const recent = ctx.dashboard.changeManagement.recentChanges.filter((c) => c.executionStatus === "completed" || c.executionStatus === "failed").slice(0, MAX_ITEMS);
  if (recent.length === 0) {
    return { intent: "validation-check", text: "No executed changes are recorded yet — nothing has been applied and validated so far.", evidence: [], relatedActionIds: [], gscUsed: false };
  }
  const text = `Showing the ${recent.length} most recent executed change(s) and their validation result.`;
  const evidence: AssistantEvidenceItem[] = recent.map((c) => ({
    url: c.page ?? undefined,
    issue: c.changeType,
    currentValue: c.executionStatus === "completed" ? "Validation passed" : "Validation failed / execution failed",
    reason: c.errorMessage ?? (c.validation ? c.validation.checks.map((ck) => `${ck.name}: ${ck.passed ? "pass" : "fail"}`).join(", ") : undefined),
    actionId: c.actionId,
  }));
  return { intent: "validation-check", text, evidence, relatedActionIds: recent.map((c) => c.actionId), gscUsed: false };
}

// --- score-explanation ---
function scoreExplanation(ctx: AssistantContext): AssistantAnswer {
  const latest = ctx.dashboard.latest;
  if (!latest) {
    return { intent: "score-explanation", text: "No audit has been run yet, so there's no score to explain. Run a scan first (/api/seo-agent/audit).", evidence: [], relatedActionIds: [], gscUsed: false };
  }
  const techFactors = latest.technicalScore.factors.filter((f) => f.contribution < f.weight);
  const onPageFactors = latest.onPageScore.factors.filter((f) => f.contribution < f.weight);
  const trend = ctx.dashboard.technicalSeo.changes?.scoreTrend;
  const parts = [
    `Overall SEO score: ${latest.score.overall}/100. Technical SEO score: ${latest.technicalScore.score}/100. On-Page SEO score: ${latest.onPageScore.score}/100.`,
    trend && trend !== "unknown" ? `The technical score is currently ${trend} compared to the previous scan.` : "",
    techFactors.length > 0 ? `Technical score is reduced by: ${techFactors.map((f) => `${f.factor} (${f.contribution}/${f.weight})`).join(", ")}.` : "Technical score has no reducing factors right now.",
    onPageFactors.length > 0 ? `On-page score is reduced by: ${onPageFactors.map((f) => `${f.factor} (${f.contribution}/${f.weight})`).join(", ")}.` : "On-page score has no reducing factors right now.",
  ].filter(Boolean);
  const evidence: AssistantEvidenceItem[] = [...techFactors, ...onPageFactors].map((f) => ({ metric: f.factor, currentValue: `${f.contribution}/${f.weight}`, reason: f.explanation }));
  return { intent: "score-explanation", text: parts.join(" "), evidence, relatedActionIds: [], gscUsed: false };
}

// --- orphan-pages ---
function orphanPages(ctx: AssistantContext): AssistantAnswer {
  const linking = ctx.dashboard.internalLinking;
  const latest = ctx.dashboard.latest;
  const orphanIssues = latest ? [...latest.criticalIssues, ...latest.warnings, ...latest.opportunities].filter((i) => i.type === "orphan-page") : [];
  const text =
    linking.potentialOrphanPages === 0
      ? `No potential orphan pages were found in the last scan — every crawled page has at least one internal link pointing to it. ${linking.weaklyConnectedPages} page(s) are weakly connected (only 1-2 inbound links).`
      : `${linking.potentialOrphanPages} potential orphan page(s) found (zero inbound internal links), plus ${linking.weaklyConnectedPages} weakly-connected page(s).`;
  return { intent: "orphan-pages", text, evidence: orphanIssues.map((i) => ({ url: i.page, issue: i.type, reason: i.message })), relatedActionIds: [], gscUsed: false };
}

// --- internal-link-opportunities ---
function internalLinkOpportunities(ctx: AssistantContext): AssistantAnswer {
  const actions = ctx.actions.filter((a) => a.issueType === "internal-link-opportunity" || a.issueType === "internal-link-recommendation");
  const top = [...actions].sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority)).slice(0, MAX_ITEMS);
  const text =
    actions.length === 0
      ? "No internal-link opportunities are currently flagged — the crawled pages appear reasonably well cross-linked."
      : `${actions.length} internal-link opportunity(ies) found. Showing the top ${top.length}, each with a suggested source page, target page, and natural anchor text (see recommendedValue on the underlying action).`;
  return { intent: "internal-link-opportunities", text, evidence: top.map(toEvidence), relatedActionIds: top.map((a) => a.id), gscUsed: false };
}

// --- content-opportunities ---
function contentOpportunities(ctx: AssistantContext): AssistantAnswer {
  const types = new Set(["content-existing-page-improvement", "content-supporting-content-opportunity", "content-new-page-opportunity"]);
  const actions = ctx.actions.filter((a) => types.has(a.issueType));
  const top = [...actions].sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority)).slice(0, MAX_ITEMS);
  const summary = ctx.dashboard.internalLinking;
  const text = ctx.gscConnected
    ? `${actions.length} content opportunity(ies) found: ${summary.existingPageImprovements} existing-page improvement(s), ${summary.supportingContentOpportunities} supporting-content idea(s), ${summary.newPageOpportunities} new-page candidate(s) — new-page opportunities are intentionally rare and conservative.`
    : `${actions.length} content opportunity(ies) found from on-page/crawl evidence only.${gscCaveat(ctx)}`;
  return { intent: "content-opportunities", text, evidence: top.map(toEvidence), relatedActionIds: top.map((a) => a.id), gscUsed: ctx.gscConnected };
}

// --- ctr-problems ---
function ctrProblems(ctx: AssistantContext): AssistantAnswer {
  if (!ctx.gscConnected) {
    return { intent: "ctr-problems", text: "Search Console is not connected, so CTR data cannot currently be verified. Connect Search Console to see real click-through-rate problems.", evidence: [], relatedActionIds: [], gscUsed: false };
  }
  const actions = ctx.actions.filter((a) => a.issueType === "gsc-high-impressions-low-ctr");
  const top = [...actions].sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority)).slice(0, MAX_ITEMS);
  const text = actions.length === 0 ? "Search Console data indicates no pages currently have meaningful impressions with unusually low CTR." : `Search Console data indicates ${actions.length} page/query pair(s) with real impressions but low click-through rate. Showing the top ${top.length}.`;
  return { intent: "ctr-problems", text, evidence: top.map(toEvidence), relatedActionIds: top.map((a) => a.id), gscUsed: true };
}

// --- keyword-opportunities ---
function keywordOpportunities(ctx: AssistantContext): AssistantAnswer {
  const ki = ctx.dashboard.keywordIntelligence;
  if (ki.queriesAnalyzed === 0) {
    return { intent: "keyword-opportunities", text: "Search Console is not connected (or no keyword analysis has run yet), so keyword opportunities cannot currently be shown. Run /api/seo-agent/keywords/analyze once Search Console is connected.", evidence: [], relatedActionIds: [], gscUsed: false };
  }
  const pool = [...ki.rankingOpportunities, ...ki.lowCtrOpportunities, ...ki.serviceOpportunities].sort((a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0)).slice(0, MAX_ITEMS);
  const text = `Based on the latest keyword-intelligence analysis (${ki.queriesAnalyzed} queries analyzed): showing the ${pool.length} highest-scoring opportunities by real Search Console evidence.`;
  return { intent: "keyword-opportunities", text, evidence: pool.map((i) => ({ url: i.page ?? undefined, issue: i.issueType, reason: i.message, currentValue: i.opportunityScore !== null ? `Opportunity score ${i.opportunityScore}/100` : undefined })), relatedActionIds: [], gscUsed: true };
}

// --- technical-issues ---
function technicalIssues(ctx: AssistantContext): AssistantAnswer {
  const tech = ctx.dashboard.technicalSeo;
  const latest = ctx.dashboard.latest;
  const techIssues = latest ? [...latest.criticalIssues, ...latest.warnings].filter((i) => i.category === "technical" || i.category === "indexability").slice(0, MAX_ITEMS) : [];
  const actionById = actionByIssueId(ctx);
  const text = `Based on the latest crawl: Technical SEO score ${tech.technicalScore?.score ?? "N/A"}/100. ${tech.critical} critical, ${tech.warnings} warning issue(s). Crawlability: ${tech.crawlabilityOk ? "OK" : "problem detected"}. Indexability: ${tech.indexabilityOk ? "OK" : "problem detected"}. Sitemap: ${tech.sitemapOk ? "OK" : "problem detected"}. Robots.txt: ${tech.robotsOk ? "OK" : "problem detected"}. Canonical health: ${tech.canonicalHealthy ? "OK" : "problem detected"}. Broken internal links: ${tech.brokenLinksCount}.`;
  return {
    intent: "technical-issues",
    text,
    evidence: techIssues.map((i) => issueToEvidence(i, actionById, buildIssueId(i))),
    relatedActionIds: techIssues.map((i) => buildIssueId(i)).filter((id) => actionById.has(id)),
    gscUsed: false,
  };
}

// --- onpage-issues ---
function onpageIssues(ctx: AssistantContext): AssistantAnswer {
  const onPage = ctx.dashboard.onPageSeo;
  const latest = ctx.dashboard.latest;
  const types = new Set(["title-recommendation", "meta-description-recommendation", "heading-recommendation", "alt-text-recommendation"]);
  const issues = latest ? [...latest.criticalIssues, ...latest.warnings, ...latest.opportunities].filter((i) => types.has(i.type)).slice(0, MAX_ITEMS) : [];
  const actionById = actionByIssueId(ctx);
  const text = `Based on the latest crawl: On-Page SEO score ${onPage.onPageScore?.score ?? "N/A"}/100. ${onPage.titleIssues} title issue(s), ${onPage.metaDescriptionIssues} meta description issue(s), ${onPage.headingIssues} heading issue(s), ${onPage.altTextIssues} alt-text issue(s). ${onPage.pagesNeedingOptimization} page(s) need optimization overall.`;
  return {
    intent: "onpage-issues",
    text,
    evidence: issues.map((i) => issueToEvidence(i, actionById, buildIssueId(i))),
    relatedActionIds: issues.map((i) => buildIssueId(i)).filter((id) => actionById.has(id)),
    gscUsed: false,
  };
}

// --- fix-first ---
function fixFirst(ctx: AssistantContext): AssistantAnswer {
  const latest = ctx.dashboard.latest;
  if (!latest) {
    return { intent: "fix-first", text: "No audit has been run yet — nothing to prioritize.", evidence: [], relatedActionIds: [], gscUsed: false };
  }
  // Priority: critical severity first, then by action priority/riskLevel — reusing the SAME priority already assigned when the action queue was generated (Steps 2-7), not a new ranking system.
  const actionById = actionByIssueId(ctx);
  const candidates = latest.criticalIssues.length > 0 ? latest.criticalIssues : [...latest.warnings, ...latest.opportunities];
  const top = candidates.slice(0, MAX_ITEMS);
  const text =
    latest.criticalIssues.length > 0
      ? `Start with the ${Math.min(top.length, latest.criticalIssues.length)} critical issue(s) below — these have the most potential impact on discoverability/indexing. Fixing an issue improves the underlying condition it addresses; it does not guarantee a ranking change.`
      : `No critical issues are currently open. Showing the highest-severity remaining items below as the next reasonable priorities.`;
  return { intent: "fix-first", text, evidence: top.map((i) => issueToEvidence(i, actionById, buildIssueId(i))), relatedActionIds: top.map((i) => buildIssueId(i)).filter((id) => actionById.has(id)), gscUsed: false };
}

// --- biggest-problems ---
function biggestProblems(ctx: AssistantContext): AssistantAnswer {
  const latest = ctx.dashboard.latest;
  if (!latest) {
    return { intent: "biggest-problems", text: "No audit has been run yet.", evidence: [], relatedActionIds: [], gscUsed: false };
  }
  const actionById = actionByIssueId(ctx);
  const top = latest.criticalIssues.slice(0, MAX_ITEMS);
  const text = latest.criticalIssues.length === 0 ? "No critical SEO issues are currently open — the available data shows the site's technical/on-page foundation is in reasonable shape." : `${latest.criticalIssues.length} critical issue(s) found in the latest scan. Showing up to ${top.length} below.`;
  return { intent: "biggest-problems", text, evidence: top.map((i) => issueToEvidence(i, actionById, buildIssueId(i))), relatedActionIds: top.map((i) => buildIssueId(i)).filter((id) => actionById.has(id)), gscUsed: false };
}

// --- gsc-status ---
function gscStatus(ctx: AssistantContext): AssistantAnswer {
  const conn = ctx.dashboard.searchConsole.connection;
  const text = `Search Console connection state: ${conn.state}.${conn.propertyUrl ? ` Property: ${conn.propertyUrl}.` : ""}${conn.lastError ? ` Last error: ${conn.lastError}.` : ""} ${ctx.gscConnected ? "GSC-based answers (CTR, keyword opportunities, content opportunities) are available." : "GSC-based answers are unavailable until this is connected."}`;
  return { intent: "gsc-status", text, evidence: [], relatedActionIds: [], gscUsed: false };
}

// --- action-explain (Task 2/5: "Why is this page weak?" for a named URL) ---
export function explainForPage(ctx: AssistantContext, path: string): AssistantAnswer {
  const actionById = actionByIssueId(ctx);
  const latest = ctx.dashboard.latest;
  const pageIssues = latest ? [...latest.criticalIssues, ...latest.warnings, ...latest.opportunities].filter((i) => i.page === path) : [];
  if (pageIssues.length === 0) {
    return { intent: "action-explain", text: `No open issues are currently recorded for ${path} in the latest scan — the available data doesn't show a specific problem with this page.`, evidence: [], relatedActionIds: [], gscUsed: false };
  }
  const text = `${pageIssues.length} issue(s) found for ${path} in the latest scan.`;
  return { intent: "action-explain", text, evidence: pageIssues.map((i) => issueToEvidence(i, actionById, buildIssueId(i))), relatedActionIds: pageIssues.map((i) => buildIssueId(i)).filter((id) => actionById.has(id)), gscUsed: false };
}

function unknown(): AssistantAnswer {
  return {
    intent: "unknown",
    text: "I don't have a specific answer for that phrasing based on the available SEO data. Try one of the suggested questions, or ask about: critical issues, what to fix first, your SEO score, keyword opportunities, CTR problems, technical issues, on-page issues, internal-link opportunities, content opportunities, orphan pages, or pending approvals.",
    evidence: [],
    relatedActionIds: [],
    gscUsed: false,
  };
}

const GENERATORS: Record<AssistantIntent, (ctx: AssistantContext) => AssistantAnswer> = {
  "pending-approvals": pendingApprovals,
  "history-changes": historyChanges,
  "score-explanation": scoreExplanation,
  "orphan-pages": orphanPages,
  "internal-link-opportunities": internalLinkOpportunities,
  "content-opportunities": contentOpportunities,
  "ctr-problems": ctrProblems,
  "keyword-opportunities": keywordOpportunities,
  "technical-issues": technicalIssues,
  "onpage-issues": onpageIssues,
  "action-explain": fixFirst, // handled specially in runAssistantQuery.ts when a target is found; falls back to fix-first framing otherwise
  "fix-first": fixFirst,
  "biggest-problems": biggestProblems,
  "gsc-status": gscStatus,
  "seo-performance": seoPerformance,
  "validation-check": validationCheck,
  unknown,
};

export function generateAnswer(intent: AssistantIntent, ctx: AssistantContext): AssistantAnswer {
  return GENERATORS[intent](ctx);
}
