import type { KeywordIntelligenceSummary, KeywordOpportunitySummaryItem, SeoIssue, SeoIssueType } from "../types";

// STEP 6 Task 5 — connects STEP 4's keyword-intelligence opportunities to
// specific crawled pages. This TRANSLATES Step 4's already-detected,
// already-scored signals into an on-page-flavored recommendation; it does
// not re-detect anything (avoiding a duplicate detection system, per the
// project's reuse rule). One consolidated recommendation per page (not
// one per matching query) so a page with several overlapping signals
// doesn't flood the action queue.
//
// Honesty note: when Search Console/keyword-intelligence data isn't
// connected (queriesAnalyzed === 0), this module intentionally produces
// nothing — Task 1's "on-page/crawl evidence only" fallback for
// content/topic concerns is covered by headingRecommendation.ts's
// H1-vs-service mismatch check and metadataRecommendation.ts's
// title-vs-H1 mismatch check, both already evidenceBasis:"on-page-only".

const TEMPLATES: Partial<Record<SeoIssueType, (item: KeywordOpportunitySummaryItem) => string>> = {
  "gsc-high-impressions-low-ctr": (i) => `Improve this page's title/meta description so it better matches "${i.query}" — it already gets real impressions but few clicks.`,
  "keyword-ranking-improvement": (i) => `Strengthen this page's content and internal links around "${i.query}" — it's realistically within reach of a better ranking position.`,
  "keyword-page-optimization": (i) => `Review and deepen this page's content for "${i.query}" — it has real search demand but currently sits on page 2 of results.`,
  "keyword-relevance-investigate": (i) => `Confirm this page's content genuinely satisfies searchers for "${i.query}" — it gets real impressions but almost no clicks.`,
  "keyword-service-match": () => `Strengthen this page's coverage of its matched service — real search demand exists but ranking is weak.`,
  "keyword-location-opportunity": () => `Reinforce this page's UK/Pakistan-specific content — it shows real location-based search demand.`,
};

export function buildContentIntentRecommendations(crawledPaths: Set<string>, keywordSummary: KeywordIntelligenceSummary): SeoIssue[] {
  if (keywordSummary.queriesAnalyzed === 0) return [];

  const pool: KeywordOpportunitySummaryItem[] = [
    ...keywordSummary.lowCtrOpportunities,
    ...keywordSummary.rankingOpportunities,
    ...keywordSummary.serviceOpportunities,
    ...keywordSummary.locationOpportunities,
  ];

  const seenPages = new Set<string>();
  const issues: SeoIssue[] = [];
  for (const item of pool) {
    if (!item.page || !crawledPaths.has(item.page) || seenPages.has(item.page)) continue;
    const template = TEMPLATES[item.issueType];
    if (!template) continue;
    seenPages.add(item.page);
    issues.push({
      type: "content-intent-recommendation",
      source: "audit",
      severity: item.severity,
      category: "content",
      page: item.page,
      query: item.query,
      message: template(item),
      currentMetric: item.opportunityScore !== null ? `Opportunity score ${item.opportunityScore}/100` : undefined,
      evidenceBasis: "gsc",
    });
  }
  return issues;
}
