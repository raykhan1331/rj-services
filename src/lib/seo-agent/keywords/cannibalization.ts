import { computeOpportunityScore } from "./opportunityScore";
import type { QueryPageRow, QueryPageMapping, SeoIssue } from "../types";

// STEP 4 Task 5 — keyword cannibalization SIGNALS only. This never
// merges, deletes, redirects, or rewrites anything — it produces a
// "keyword-cannibalization" SeoIssue (source: keyword-intelligence),
// which STEP 4 Task 9 forces into the action queue with
// status "review-required" for a human to actually investigate.
//
// Honesty note (Task 5's "ranking URLs change frequently for similar
// queries" signal): detecting that requires a time series of daily/weekly
// rankings. This system only has two aggregate snapshots (current vs
// previous 28-day period — STEP 3), not day-by-day data, so that specific
// signal is NOT implemented — it would require STEP 3's date-range
// architecture to store many more snapshots than it currently does. Only
// the two signals that ARE detectable with the current data are built:
// multiple pages ranking for the same query, and multiple pages ranking
// for closely-related queries.

const MIN_IMPRESSIONS_TO_COUNT = 10;

function normalizeQueryForSimilarity(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

export function detectCannibalization(mappings: QueryPageMapping[], rows: QueryPageRow[]): SeoIssue[] {
  const issues: SeoIssue[] = [];

  // Signal 1: the SAME query has meaningful impressions on 2+ distinct pages.
  for (const mapping of mappings) {
    const byPage = new Map<string, number>();
    for (const row of rows) {
      if (row.query !== mapping.query) continue;
      byPage.set(row.page, (byPage.get(row.page) ?? 0) + row.impressions);
    }
    const meaningfulPages = Array.from(byPage.entries()).filter(([, impressions]) => impressions >= MIN_IMPRESSIONS_TO_COUNT);
    if (meaningfulPages.length < 2) continue;

    const score = computeOpportunityScore({
      impressions: mapping.totalImpressions,
      position: mapping.averagePosition,
      ctr: mapping.averageCtr,
      pageRelevance: mapping.pageRelevance,
    });

    issues.push({
      type: "keyword-cannibalization",
      source: "keyword-intelligence",
      severity: "warning",
      category: "search-performance",
      page: mapping.primaryPage,
      query: mapping.query,
      searchIntent: mapping.searchIntent,
      opportunityScore: score,
      currentMetric: `${mapping.totalClicks} clicks, ${mapping.totalImpressions} impressions across ${meaningfulPages.length} pages`,
      evidence: meaningfulPages.map(([page, impressions]) => `${page} (${impressions} impr.)`).join(", "),
      message: `${meaningfulPages.length} different pages get impressions for "${mapping.query}" — possible keyword cannibalization. Review which page should be the single authoritative target.`,
    });
  }

  // Signal 2: different queries that normalize to the same word set
  // (e.g. "uk company formation" / "company formation uk") ranking on
  // different primary pages — same intent, competing pages.
  const byNormalizedQuery = new Map<string, QueryPageMapping[]>();
  for (const mapping of mappings) {
    const key = normalizeQueryForSimilarity(mapping.query);
    if (!key) continue;
    byNormalizedQuery.set(key, [...(byNormalizedQuery.get(key) ?? []), mapping]);
  }
  for (const group of byNormalizedQuery.values()) {
    if (group.length < 2) continue;
    const distinctPages = new Set(group.map((m) => m.primaryPage));
    if (distinctPages.size < 2) continue; // same wording variants, same page — not a conflict

    const totalImpressions = group.reduce((sum, m) => sum + m.totalImpressions, 0);
    if (totalImpressions < MIN_IMPRESSIONS_TO_COUNT) continue;

    const strongest = group.reduce((a, b) => (b.totalClicks > a.totalClicks ? b : a));
    const score = computeOpportunityScore({
      impressions: totalImpressions,
      position: strongest.averagePosition,
      ctr: strongest.averageCtr,
      pageRelevance: strongest.pageRelevance,
    });

    issues.push({
      type: "keyword-cannibalization",
      source: "keyword-intelligence",
      severity: "opportunity",
      category: "search-performance",
      page: strongest.primaryPage,
      query: strongest.query,
      searchIntent: strongest.searchIntent,
      opportunityScore: score,
      currentMetric: `${totalImpressions} combined impressions across ${distinctPages.size} pages for closely-related queries`,
      evidence: group.map((m) => `"${m.query}" → ${m.primaryPage}`).join(", "),
      message: `Closely-related query variants rank on ${distinctPages.size} different pages — worth confirming each page targets a distinct intent rather than competing for the same one.`,
    });
  }

  return issues;
}
