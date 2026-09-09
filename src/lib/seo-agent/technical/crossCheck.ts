import type { GscPeriodComparison, GscRow, SeoAuditReport, SeoIssue } from "../types";

// STEP 5 Task 5 — cross-references the latest technical audit against
// the latest Search Console data. Both are ALREADY-CACHED (the latest
// persisted audit report from history.ts, and the latest persisted GSC
// comparison from gsc/performanceStore.ts) — this never triggers a new
// crawl or a new Google API call of its own, per Task 11's reuse-cache
// rule. Every signal here is phrased as a correlation worth investigating,
// never a proven cause — the available data (two aggregate snapshots) does
// not support causation claims.

const MIN_VISIBILITY_IMPRESSIONS = 10;
const MIN_PRIOR_CLICKS_FOR_DISAPPEARANCE = 5;

function urlToPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function normalizePath(p: string): string {
  const stripped = p.split("?")[0].split("#")[0];
  return stripped.length > 1 && stripped.endsWith("/") ? stripped.slice(0, -1) : stripped || "/";
}

function rowsByPath(rows: GscRow[]): Map<string, GscRow> {
  const map = new Map<string, GscRow>();
  for (const row of rows) map.set(normalizePath(urlToPath(row.keys[0])), row);
  return map;
}

/** A previous SeoAuditReport's full flat issue list — see
 * changeDetection.ts's identical helper for why this is always complete. */
function flattenReportIssues(report: SeoAuditReport): SeoIssue[] {
  return [...report.criticalIssues, ...report.warnings, ...report.opportunities];
}

export function detectTechnicalGscCrossCheck(latestAuditReport: SeoAuditReport | null, comparison: GscPeriodComparison | null, gscOpportunityIssues: SeoIssue[]): SeoIssue[] {
  const issues: SeoIssue[] = [];
  if (!latestAuditReport || !comparison) return issues; // nothing to cross-check without both cached datasets

  const currentPagesByPath = rowsByPath(comparison.current.topPages);
  const previousPagesByPath = rowsByPath(comparison.previous.topPages);
  const visibility = (path: string) => currentPagesByPath.get(path) ?? previousPagesByPath.get(path);

  const allTechIssues = flattenReportIssues(latestAuditReport);

  // Signal: a page with real GSC visibility is (or has become) noindex,
  // or has a canonical problem — prioritize these over an identical
  // issue on a page with no measurable search traffic.
  for (const issue of allTechIssues) {
    if (!issue.page) continue;
    const path = normalizePath(issue.page);
    const gscRow = visibility(path);
    if (!gscRow || gscRow.impressions < MIN_VISIBILITY_IMPRESSIONS) continue;

    if (issue.type === "noindex-meta") {
      issues.push({
        type: "noindex-visible-page",
        source: "search-console",
        severity: "critical",
        category: "indexability",
        page: path,
        currentMetric: `${gscRow.clicks} clicks, ${gscRow.impressions} impressions in Search Console`,
        message: `${path} has real Search Console visibility (${gscRow.impressions} impressions) but is currently noindex — it will disappear from search results if this isn't intentional.`,
        evidence: issue.evidence,
      });
    } else if (issue.type === "canonical-origin-mismatch" || issue.type === "canonical-target-invalid" || issue.type === "canonical-points-elsewhere") {
      issues.push({
        type: "canonical-issue-visible-page",
        source: "search-console",
        severity: "warning",
        category: "indexability",
        page: path,
        currentMetric: `${gscRow.clicks} clicks, ${gscRow.impressions} impressions in Search Console`,
        message: `${path} has real Search Console visibility but also has a canonical issue (${issue.type}) detected this scan — worth prioritizing over similar issues on lower-traffic pages.`,
        evidence: issue.message,
      });
    }
  }

  // Signal: a page with a newly-detected technical issue this scan also
  // shows a GSC-detected clicks/impressions decline (Step 3's existing
  // detectPageOpportunities). Correlation only — phrased as such.
  const decliningPages = new Set(
    gscOpportunityIssues.filter((i) => (i.type === "gsc-declining-clicks" || i.type === "gsc-declining-impressions") && i.page).map((i) => normalizePath(i.page!))
  );
  const techIssuesByPage = new Map<string, SeoIssue[]>();
  for (const issue of allTechIssues) {
    if (!issue.page) continue;
    const path = normalizePath(issue.page);
    techIssuesByPage.set(path, [...(techIssuesByPage.get(path) ?? []), issue]);
  }
  for (const path of decliningPages) {
    const pageIssues = techIssuesByPage.get(path);
    if (!pageIssues || pageIssues.length === 0) continue;
    issues.push({
      type: "technical-issue-page-declining",
      source: "search-console",
      severity: "warning",
      category: "search-performance",
      page: path,
      message: `${path} has ${pageIssues.length} technical issue(s) detected this scan (e.g. "${pageIssues[0].type}") and also shows a Search Console clicks/impressions decline — these may be related; investigate before assuming causation.`,
      evidence: pageIssues.map((i) => i.type).join(", "),
    });
  }

  // Signal: a page with meaningful prior clicks has zero data in the
  // current period at all — worth a manual indexability check.
  for (const [path, prevRow] of previousPagesByPath) {
    if (prevRow.clicks < MIN_PRIOR_CLICKS_FOR_DISAPPEARANCE) continue;
    if (currentPagesByPath.has(path)) continue;
    issues.push({
      type: "page-missing-from-search-console",
      source: "search-console",
      severity: "opportunity",
      category: "search-performance",
      page: path,
      currentMetric: `${prevRow.clicks} clicks, ${prevRow.impressions} impressions previous period; 0 this period`,
      message: `${path} had ${prevRow.clicks} clicks in the previous period but has no data in the current period — worth checking its indexability (robots meta, canonical, sitemap presence).`,
    });
  }

  return issues;
}
