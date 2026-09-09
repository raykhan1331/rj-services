import type { ChangeHistoryEntry, ImportantPageStatus, SeoAlert, SeoAuditReport, SeoHealthScore, TechnicalSeoSummary } from "../types";
import type { ConflictReport } from "../automation/types";

// STEP 10 Task 8 — deterministic, rule-based alerts over data already
// computed elsewhere (no new detection). Deliberately consolidated —
// one alert per CONDITION, not one per underlying issue instance — so a
// page with 10 technical problems produces one "critical technical
// issues" alert, not ten, per Task 8's "avoid excessive/noisy alerts".

const SCORE_DECLINE_THRESHOLD = 10; // points
const VISIBILITY_DECLINE_THRESHOLD_PCT = 20;
const BROKEN_LINKS_THRESHOLD = 5;

let alertCounter = 0;
function makeId(type: string): string {
  alertCounter += 1;
  return `${type}:${new Date().toISOString()}:${alertCounter}`;
}

export interface AlertInputs {
  latest: SeoAuditReport | null;
  previousHealthScore: number | null;
  healthScore: SeoHealthScore;
  technicalSeo: TechnicalSeoSummary;
  importantPages: ImportantPageStatus[];
  gscClicksPct: number | null;
  gscImpressionsPct: number | null;
  recentChangeHistory: ChangeHistoryEntry[];
  conflicts: ConflictReport[];
}

export function generateAlerts(inputs: AlertInputs): SeoAlert[] {
  const alerts: SeoAlert[] = [];
  const { latest, previousHealthScore, healthScore, technicalSeo, importantPages, gscClicksPct, gscImpressionsPct, recentChangeHistory, conflicts } = inputs;

  if (latest && latest.criticalIssues.length > 0) {
    alerts.push({
      id: makeId("critical-technical-issues"),
      type: "critical-technical-issues",
      severity: "critical",
      page: null,
      evidence: `${latest.criticalIssues.length} critical issue(s) open: ${[...new Set(latest.criticalIssues.map((i) => i.type))].slice(0, 5).join(", ")}.`,
      detectedAt: latest.generatedAt,
      relatedActionId: null,
      recommendedNextStep: "Review critical issues in the Action Queue and approve fixes for the highest-impact ones first.",
      status: "open",
    });
  }

  if (!technicalSeo.sitemapOk || !technicalSeo.robotsOk) {
    alerts.push({
      id: makeId("sitemap-robots-issue"),
      type: "sitemap-robots-issue",
      severity: "critical",
      page: null,
      evidence: `sitemap.xml OK: ${technicalSeo.sitemapOk}; robots.txt OK: ${technicalSeo.robotsOk}.`,
      detectedAt: technicalSeo.lastScanAt ?? new Date().toISOString(),
      relatedActionId: null,
      recommendedNextStep: "Investigate sitemap/robots reachability — this can affect discovery of the whole site.",
      status: "open",
    });
  }

  if (technicalSeo.brokenLinksCount >= BROKEN_LINKS_THRESHOLD) {
    alerts.push({
      id: makeId("broken-internal-links"),
      type: "broken-internal-links",
      severity: "warning",
      page: null,
      evidence: `${technicalSeo.brokenLinksCount} page(s) have broken internal links.`,
      detectedAt: technicalSeo.lastScanAt ?? new Date().toISOString(),
      relatedActionId: null,
      recommendedNextStep: "Review the broken-internal-link recommendations in the Action Queue.",
      status: "open",
    });
  }

  if (previousHealthScore !== null && previousHealthScore - healthScore.score >= SCORE_DECLINE_THRESHOLD) {
    alerts.push({
      id: makeId("seo-score-decline"),
      type: "seo-score-decline",
      severity: "critical",
      page: null,
      evidence: `SEO health score dropped from ${previousHealthScore} to ${healthScore.score} (-${previousHealthScore - healthScore.score} points).`,
      detectedAt: new Date().toISOString(),
      relatedActionId: null,
      recommendedNextStep: "Review the trend breakdown to identify which component (technical, on-page, search visibility) declined.",
      status: "open",
    });
  }

  if (gscClicksPct !== null && gscClicksPct <= -VISIBILITY_DECLINE_THRESHOLD_PCT) {
    alerts.push({
      id: makeId("search-visibility-decline"),
      type: "search-visibility-decline",
      severity: "critical",
      page: null,
      evidence: `Search Console clicks declined ${Math.abs(gscClicksPct).toFixed(0)}% period-over-period${gscImpressionsPct !== null ? ` (impressions ${gscImpressionsPct >= 0 ? "+" : ""}${gscImpressionsPct.toFixed(0)}%)` : ""}.`,
      detectedAt: new Date().toISOString(),
      relatedActionId: null,
      recommendedNextStep: "Check for a technical/indexability cause first (see technical alerts); if none, this may reflect genuine search-demand or ranking changes outside this system's visibility.",
      status: "open",
    });
  }

  for (const p of importantPages) {
    if (p.newIssues.some((t) => t === "noindex-meta")) {
      alerts.push({
        id: makeId("important-page-noindex"),
        type: "important-page-noindex",
        severity: "critical",
        page: p.page,
        evidence: `${p.page} (${p.importanceEvidence}) now has a noindex directive.`,
        detectedAt: new Date().toISOString(),
        relatedActionId: null,
        recommendedNextStep: "Confirm this is intentional; if not, remove the noindex directive as soon as possible.",
        status: "open",
      });
    }
    if (p.newIssues.some((t) => t.startsWith("canonical"))) {
      alerts.push({
        id: makeId("important-page-canonical"),
        type: "important-page-canonical",
        severity: "warning",
        page: p.page,
        evidence: `${p.page} (${p.importanceEvidence}) has a new canonical-related issue.`,
        detectedAt: new Date().toISOString(),
        relatedActionId: null,
        recommendedNextStep: "Review this page's canonical tag before its search visibility is affected.",
        status: "open",
      });
    }
  }

  for (const entry of recentChangeHistory) {
    if (entry.executionStatus === "failed" && entry.validation && !entry.validation.passed) {
      alerts.push({
        id: makeId("validation-failed"),
        type: "approved-change-validation-failed",
        severity: "warning",
        page: entry.page,
        evidence: entry.errorMessage ?? "Validation failed after an approved change was applied.",
        detectedAt: entry.timestamp,
        relatedActionId: entry.actionId,
        recommendedNextStep: entry.rollbackStatus === "rollback-available" ? "Rollback is available — review and confirm if the change should be reverted." : "Review the change manually.",
        status: "open",
      });
    }
    if (entry.rollbackStatus === "rollback-available" && entry.executionStatus === "completed") {
      alerts.push({
        id: makeId("rollback-available"),
        type: "rollback-available",
        severity: "info",
        page: entry.page,
        evidence: `A completed change on ${entry.page ?? "this action"} has a rollback available.`,
        detectedAt: entry.timestamp,
        relatedActionId: entry.actionId,
        recommendedNextStep: "No action needed unless you want to revert this change.",
        status: "open",
      });
    }
  }

  for (const conflict of conflicts) {
    alerts.push({
      id: makeId("change-conflict"),
      type: "change-conflict",
      severity: "warning",
      page: null,
      evidence: conflict.description,
      detectedAt: new Date().toISOString(),
      relatedActionId: conflict.actionIds[0] ?? null,
      recommendedNextStep: "Review the conflicting actions together before approving either.",
      status: "open",
    });
  }

  return alerts;
}
