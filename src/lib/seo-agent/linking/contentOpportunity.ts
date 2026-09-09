import { SEO_CONFIG } from "../config";
import { keywordOverlap } from "../keywords/relevance";
import type { CrawledPage } from "../crawler";
import type { KeywordIntelligenceSummary, SeoIssue, SeoIssueRecord } from "../types";

// STEP 7 Task 6/7/8/9 — content-opportunity detection. Deliberately built
// as a TRANSLATION layer over STEP 4's already-detected, already-scored
// keyword-intelligence issues (read from the shared issue store, source:
// "keyword-intelligence" — cached, no new GSC call) rather than a second
// detection pass; this is what lets Task 8's score keep the SAME real
// `opportunityScore` factor breakdown STEP 4 computed, satisfying "explain
// why each high-scoring opportunity received its score" without inventing
// new numbers. When no keyword-intelligence data exists at all (GSC never
// connected), falls back to an honestly-labeled on-page/crawl-only check.

const MIN_IMPRESSIONS_FOR_NEW_PAGE = 80; // conservative — sustained, meaningful demand only
const MIN_SERVICE_OVERLAP = 0.3;

const EXISTING_PAGE_IMPROVEMENT_TYPES = new Set(["keyword-ranking-improvement", "keyword-page-optimization", "keyword-relevance-investigate", "gsc-high-impressions-low-ctr"]);

function normalizePath(p: string): string {
  const stripped = p.split("?")[0].split("#")[0];
  return stripped.length > 1 && stripped.endsWith("/") ? stripped.slice(0, -1) : stripped || "/";
}

function matchesRealService(query: string): boolean {
  return SEO_CONFIG.primaryServices.some((s) => keywordOverlap(s.label, query) >= MIN_SERVICE_OVERLAP || keywordOverlap(query, s.label) >= MIN_SERVICE_OVERLAP);
}

/** Task 6/7's GSC-backed detection, built from STEP 4's persisted
 * keyword-intelligence issue records (already open/reconciled — no new
 * detection, purely a re-classification for THIS engine's purposes). */
function fromKeywordIntelligence(records: SeoIssueRecord[], crawledPaths: Set<string>): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const seen = new Set<string>();

  for (const rec of records) {
    if (!rec.page || !crawledPaths.has(rec.page)) continue;

    if (EXISTING_PAGE_IMPROVEMENT_TYPES.has(rec.type)) {
      const key = `improve:${rec.page}:${rec.query ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      issues.push({
        type: "content-existing-page-improvement",
        source: "audit",
        severity: rec.severity,
        category: "content",
        page: rec.page,
        query: rec.query,
        contentGapType: "existing-page-improvement",
        message: `${rec.page}: ${rec.description}`,
        currentMetric: rec.currentMetric,
        opportunityScore: rec.opportunityScore,
        evidenceBasis: "gsc",
      });
    } else if (rec.type === "keyword-service-match" && rec.description.includes("No Search Console queries matched")) {
      const key = `support:${rec.page}`;
      if (seen.has(key)) continue;
      seen.add(key);
      issues.push({
        type: "content-supporting-content-opportunity",
        source: "audit",
        severity: "opportunity",
        category: "content",
        page: rec.page,
        contentGapType: "supporting-content",
        message: `${rec.page}: no measurable Search Console visibility yet for its matched service — consider a supporting FAQ/resource addition rather than assuming a whole new page is needed.`,
        evidenceBasis: "gsc",
      });
    } else if (rec.type === "keyword-location-opportunity") {
      // Task 9 — a location/topic signal is ALWAYS classified as
      // reinforcing an existing page, never as a new-page candidate, per
      // the explicit "do not generate mass location pages" rule.
      const key = `location:${rec.page}:${rec.query ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      issues.push({
        type: "content-existing-page-improvement",
        source: "audit",
        severity: rec.severity,
        category: "content",
        page: rec.page,
        query: rec.query,
        contentGapType: "existing-page-improvement",
        message: `${rec.page}: ${rec.description} (location/topic signal — reinforcing existing content is preferred over a new location page).`,
        opportunityScore: rec.opportunityScore,
        evidenceBasis: "gsc",
      });
    }
  }

  return issues;
}

/** Task 6/7's rare, conservative "New Page Opportunity" check: a
 * genuinely high-demand query whose primary ranking page ISN'T one of
 * this site's real crawled pages, and that doesn't match any real
 * service either — i.e., real search demand that structurally has
 * nowhere to live on the site today. Reads the summary's raw query rows
 * (not the pre-classified issue records) since this needs `page` per
 * query, not per already-detected issue. */
function detectNewPageOpportunities(keywordSummary: KeywordIntelligenceSummary, crawledPaths: Set<string>): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const seen = new Set<string>();
  const rows = [...keywordSummary.topQueries, ...keywordSummary.highestImpressionQueries];

  for (const row of rows) {
    if (seen.has(row.query)) continue;
    if (row.page && crawledPaths.has(normalizePath(row.page))) continue; // already has a real home — an improvement, not a gap
    if (row.impressions < MIN_IMPRESSIONS_FOR_NEW_PAGE) continue;
    if (matchesRealService(row.query)) continue; // a real service plausibly already covers this
    seen.add(row.query);
    issues.push({
      type: "content-new-page-opportunity",
      source: "audit",
      severity: "opportunity",
      category: "content",
      query: row.query,
      contentGapType: "new-page-opportunity",
      message: `"${row.query}" shows real, sustained search demand (${row.impressions} impressions) that doesn't map to any existing page or service — worth evaluating whether it's a genuinely distinct need before considering new content (never create a page for a keyword alone).`,
      currentMetric: `${row.clicks} clicks, ${row.impressions} impressions, avg position ${row.position.toFixed(1)}`,
      evidenceBasis: "gsc",
    });
  }

  return issues;
}

/** Fallback for when Search Console has never been connected — real
 * crawl/on-page evidence only (thin content on an actual service page),
 * clearly labeled as such (Task 8's explicit requirement). */
function fromOnPageEvidence(crawled: CrawledPage[]): SeoIssue[] {
  const issues: SeoIssue[] = [];
  for (const { route, parsed } of crawled) {
    if (parsed.fetchError) continue;
    const service = SEO_CONFIG.primaryServices.find((s) => s.href === route.path);
    if (!service) continue;
    if (parsed.wordCount < SEO_CONFIG.rules.thinContentWordThreshold) {
      issues.push({
        type: "content-existing-page-improvement",
        source: "audit",
        severity: "opportunity",
        category: "content",
        page: route.path,
        contentGapType: "existing-page-improvement",
        message: `${route.path} (${service.label}) has thin content (~${parsed.wordCount} words). Search Console isn't connected, so this is based on crawl/on-page evidence only, not real query data.`,
        currentMetric: `~${parsed.wordCount} words`,
        evidenceBasis: "on-page-only",
      });
    }
  }
  return issues;
}

export function detectContentOpportunities(keywordIntelligenceRecords: SeoIssueRecord[], keywordSummary: KeywordIntelligenceSummary, crawled: CrawledPage[]): SeoIssue[] {
  const crawledPaths = new Set(crawled.filter((c) => !c.parsed.fetchError).map((c) => normalizePath(c.route.path)));

  if (keywordSummary.queriesAnalyzed === 0 || keywordIntelligenceRecords.length === 0) {
    return fromOnPageEvidence(crawled);
  }

  return [...fromKeywordIntelligence(keywordIntelligenceRecords, crawledPaths), ...detectNewPageOpportunities(keywordSummary, crawledPaths)];
}
