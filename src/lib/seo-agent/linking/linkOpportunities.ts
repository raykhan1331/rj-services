import { keywordOverlap, pageRelevanceText } from "../keywords/relevance";
import type { CrawledPage } from "../crawler";
import type { GscPeriodComparison, KeywordIntelligenceSummary, LinkGraphSummary, SeoIssue } from "../types";

// STEP 7 Task 3/4 — a richer version of STEP 6's internal-link
// recommendation: STEP 6 only weighs topical overlap; this ALSO weighs
// real Search Console evidence (impressions/clicks — Task 4's "prioritize
// pages that already have evidence of value") and real Step 4
// keyword-intelligence signals, both already cached (no new fetch). Skips
// any (source, target) pair STEP 6 already recommended, so nothing is
// double-reported in the action queue.

const MIN_INBOUND_FOR_IMPORTANT = 2;
const MIN_RELEVANCE_TO_RECOMMEND = 0.15;
const HIGH_VALUE_IMPRESSIONS = 100;
const MEDIUM_VALUE_IMPRESSIONS = 20;

function normalizePath(p: string): string {
  const stripped = p.split("?")[0].split("#")[0];
  return stripped.length > 1 && stripped.endsWith("/") ? stripped.slice(0, -1) : stripped || "/";
}

function urlToPath(url: string): string {
  try {
    return normalizePath(new URL(url).pathname);
  } catch {
    return normalizePath(url);
  }
}

/** Real, evidence-based importance signal for one page: GSC impressions
 * (current period, falling back to previous), plus whether Step 4 flagged
 * it as a keyword-intelligence opportunity page. Returns null when there
 * is no real evidence at all — never a guessed number. */
function pageEvidence(path: string, gsc: GscPeriodComparison | null, keywordSummary: KeywordIntelligenceSummary): { impressions: number; clicks: number; hasKeywordSignal: boolean } | null {
  let impressions = 0;
  let clicks = 0;
  let found = false;
  if (gsc) {
    const row = gsc.current.topPages.find((r) => urlToPath(r.keys[0]) === path) ?? gsc.previous.topPages.find((r) => urlToPath(r.keys[0]) === path);
    if (row) {
      impressions = row.impressions;
      clicks = row.clicks;
      found = true;
    }
  }
  const hasKeywordSignal = [...keywordSummary.rankingOpportunities, ...keywordSummary.serviceOpportunities, ...keywordSummary.topQueries].some((i) => "page" in i && i.page === path);
  if (!found && !hasKeywordSignal) return null;
  return { impressions, clicks, hasKeywordSignal };
}

export function recommendLinkOpportunities(
  crawled: CrawledPage[],
  graph: LinkGraphSummary,
  gsc: GscPeriodComparison | null,
  keywordSummary: KeywordIntelligenceSummary,
  existingOnPageIssues: SeoIssue[]
): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const fetchable = crawled.filter((c) => !c.parsed.fetchError);
  const pageByPath = new Map(fetchable.map((c) => [normalizePath(c.route.path), c]));

  const alreadyRecommended = new Set(
    existingOnPageIssues.filter((i) => i.type === "internal-link-recommendation" && i.page && i.linkTarget).map((i) => `${i.page}→${i.linkTarget}`)
  );
  const existingEdgeTargets = new Map<string, Set<string>>();
  for (const edge of graph.edges) {
    const set = existingEdgeTargets.get(edge.source) ?? new Set<string>();
    set.add(edge.target);
    existingEdgeTargets.set(edge.source, set);
  }

  // Consider any page with genuine evidence of value (GSC or keyword
  // intelligence) that's under-linked — not just service/hub pages, per
  // Task 4's "prioritize pages that already have evidence of value"
  // rather than assuming importance from route kind alone.
  const candidateTargets = graph.nodes.filter((n) => n.inboundCount < MIN_INBOUND_FOR_IMPORTANT && (n.isPriority || pageEvidence(n.path, gsc, keywordSummary) !== null));

  for (const targetNode of candidateTargets) {
    const targetPage = pageByPath.get(targetNode.path);
    if (!targetPage) continue;

    const evidence = pageEvidence(targetNode.path, gsc, keywordSummary);
    const targetText = pageRelevanceText({ title: targetPage.parsed.title, h1s: targetPage.parsed.h1s, path: targetNode.path });

    const candidates = fetchable
      .filter((c) => normalizePath(c.route.path) !== targetNode.path)
      .filter((c) => !(existingEdgeTargets.get(normalizePath(c.route.path))?.has(targetNode.path)))
      .filter((c) => !alreadyRecommended.has(`${normalizePath(c.route.path)}→${targetNode.path}`))
      .map((c) => ({ page: c, score: keywordOverlap(pageRelevanceText({ title: c.parsed.title, h1s: c.parsed.h1s, path: c.route.path }), targetText) }))
      .sort((a, b) => b.score - a.score);

    const best = candidates[0];
    if (!best || best.score < MIN_RELEVANCE_TO_RECOMMEND) continue;

    const anchorText = targetPage.parsed.h1s[0] ?? targetPage.parsed.title?.split(" | ")[0]?.trim() ?? targetNode.path.replace(/[-/]/g, " ").trim();

    // Internal-link suggestions are inherently safe/low-risk (Task 11) —
    // their priority ceiling is "medium" (severity "warning"), never
    // "critical"/"high", which is reserved for issues that actually break
    // something. Strong real evidence still earns the higher of the two.
    let severity: "warning" | "opportunity" = "opportunity";
    let evidenceLine = `Topical overlap: ${(best.score * 100).toFixed(0)}%.`;
    let evidenceBasis: "gsc" | "on-page-only" = "on-page-only";
    if (evidence) {
      evidenceBasis = "gsc";
      evidenceLine += ` Real evidence: ${evidence.clicks} clicks, ${evidence.impressions} impressions${evidence.hasKeywordSignal ? ", flagged as a keyword-intelligence opportunity" : ""}.`;
      if (evidence.impressions >= HIGH_VALUE_IMPRESSIONS || (evidence.impressions >= MEDIUM_VALUE_IMPRESSIONS && evidence.hasKeywordSignal)) severity = "warning";
    } else if (targetNode.isPriority && targetNode.inboundCount === 0) {
      severity = "warning"; // a core service page with literally zero inbound links, even without GSC evidence yet
    }

    issues.push({
      type: "internal-link-opportunity",
      source: "audit",
      severity,
      category: "internal-linking",
      page: normalizePath(best.page.route.path),
      linkTarget: targetNode.path,
      message: `Internal-link opportunity: link from ${normalizePath(best.page.route.path)} to ${targetNode.path} (currently ${targetNode.inboundCount} inbound link(s)).`,
      evidence: evidenceLine,
      recommendedValue: anchorText,
      evidenceBasis,
    });
  }

  return issues;
}
