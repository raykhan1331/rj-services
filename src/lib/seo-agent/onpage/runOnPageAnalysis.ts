import { recommendTitle, recommendMetaDescription, type OnPageContext } from "./metadataRecommendation";
import { recommendHeading } from "./headingRecommendation";
import { buildContentIntentRecommendations } from "./contentIntentRecommendation";
import { recommendInternalLinks } from "./internalLinkRecommendation";
import { recommendAltText } from "./altTextRecommendation";
import type { CrawledPage } from "../crawler";
import type { KeywordIntelligenceSummary, PageAuditResult, SeoIssue } from "../types";

// STEP 6 — the on-page analysis orchestrator, called from runAudit.ts
// right after the crawl and cross-page checks, reusing the SAME in-memory
// crawl data (Task 15's "reuse existing crawl data, do not crawl the same
// page unnecessarily") and the SAME per-page issue set STEP 1/5 already
// computed (so title/meta/heading recommendations know whether a page
// already has a missing/duplicate/length issue, without re-detecting it).

export function runOnPageAnalysis(crawled: CrawledPage[], pageResults: PageAuditResult[], crossPageIssues: SeoIssue[], keywordSummary: KeywordIntelligenceSummary): SeoIssue[] {
  const issueTypesByPage = new Map<string, Set<string>>();
  for (const r of pageResults) issueTypesByPage.set(r.path, new Set(r.issues.map((i) => i.type)));
  for (const issue of crossPageIssues) {
    if (!issue.page) continue;
    const set = issueTypesByPage.get(issue.page) ?? new Set<string>();
    set.add(issue.type);
    issueTypesByPage.set(issue.page, set);
  }

  const issues: SeoIssue[] = [];

  for (const { route, parsed } of crawled) {
    if (!parsed || parsed.fetchError) continue; // nothing analyzable without a successful fetch
    const ctx: OnPageContext = { path: route.path, parsed, existingIssueTypes: issueTypesByPage.get(route.path) ?? new Set<string>() };

    const title = recommendTitle(ctx, keywordSummary);
    if (title) issues.push(title);

    const meta = recommendMetaDescription(ctx, keywordSummary);
    if (meta) issues.push(meta);

    const heading = recommendHeading(ctx);
    if (heading) issues.push(heading);
  }

  const crawledPaths = new Set(crawled.map((c) => c.route.path));
  issues.push(...buildContentIntentRecommendations(crawledPaths, keywordSummary));
  issues.push(...recommendInternalLinks(crawled));
  issues.push(...recommendAltText(crawled));

  return issues;
}
