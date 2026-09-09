import { SEO_CONFIG } from "../config";
import type { GscPeriodComparison, ImportantPageStatus, PageRecord, SeoIssueRecord, TechnicalChangeSummary } from "../types";

// STEP 10 Task 7 — identifies "important" pages from EXISTING real
// evidence (a real matched service, or real GSC visibility — same
// pageEvidence pattern STEP 7's linkOpportunities.ts already established)
// and reports their current open-issue count plus any NEW issue since
// the last scan (reusing STEP 5's already-computed TechnicalChangeSummary
// — no new diffing). Never modifies a page — read-only monitoring.

const MIN_IMPRESSIONS_FOR_IMPORTANCE = 10;

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

export function identifyImportantPages(pages: PageRecord[], gscComparison: GscPeriodComparison | null, openIssues: SeoIssueRecord[], changes: TechnicalChangeSummary | null): ImportantPageStatus[] {
  const gscImpressionsByPath = new Map<string, number>();
  if (gscComparison) {
    for (const row of [...gscComparison.current.topPages, ...gscComparison.previous.topPages]) {
      const path = urlToPath(row.keys[0]);
      gscImpressionsByPath.set(path, Math.max(gscImpressionsByPath.get(path) ?? 0, row.impressions));
    }
  }

  const servicePaths = new Set(SEO_CONFIG.primaryServices.map((s) => normalizePath(s.href)));
  const issuesByPage = new Map<string, SeoIssueRecord[]>();
  for (const issue of openIssues) {
    if (!issue.page) continue;
    const path = normalizePath(issue.page);
    issuesByPage.set(path, [...(issuesByPage.get(path) ?? []), issue]);
  }
  const newIssueKeys = new Set((changes?.newIssues ?? []).filter((e) => e.page).map((e) => `${normalizePath(e.page!)}::${e.type}`));

  const results: ImportantPageStatus[] = [];
  for (const page of pages) {
    const path = normalizePath(page.path);
    const impressions = gscImpressionsByPath.get(path) ?? 0;
    const isService = servicePaths.has(path);
    const isVisible = impressions >= MIN_IMPRESSIONS_FOR_IMPORTANCE;
    if (!isService && !isVisible) continue;

    const evidenceParts: string[] = [];
    if (isService) evidenceParts.push("matches a real business service");
    if (isVisible) evidenceParts.push(`${impressions} Search Console impressions`);

    const pageIssues = issuesByPage.get(path) ?? [];
    const newIssues = pageIssues.filter((i) => newIssueKeys.has(`${path}::${i.type}`)).map((i) => i.type);

    results.push({
      page: path,
      importanceEvidence: evidenceParts.join("; "),
      newIssues: [...new Set(newIssues)],
      openIssueCount: pageIssues.length,
    });
  }

  return results.sort((a, b) => b.openIssueCount - a.openIssueCount);
}
