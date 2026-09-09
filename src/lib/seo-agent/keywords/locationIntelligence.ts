import { SEO_CONFIG } from "../config";
import { queryMentionsLocation } from "./intentClassifier";
import { computeOpportunityScore } from "./opportunityScore";
import { keywordOverlap } from "./relevance";
import type { QueryPageMapping, SeoIssue } from "../types";

// STEP 4 Task 7 — location intelligence, scoped to the business's REAL
// target markets (SEO_CONFIG.targetCountries: United Kingdom, Pakistan —
// STEP 1) and the one real verified address (Faisalabad — see
// intentClassifier.ts's LOCATION_TERMS). Deliberately does NOT generate
// per-city breakdowns for cities the business has no presence in — that
// would be exactly the "doorway pages"/"fake location pages" pattern
// Task 12 prohibits. This only ever produces recommendations.

const MIN_IMPRESSIONS_FOR_SIGNAL = 10;

export function detectLocationOpportunities(mappings: QueryPageMapping[]): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const locationQueries = mappings.filter((m) => queryMentionsLocation(m.query) && m.totalImpressions >= MIN_IMPRESSIONS_FOR_SIGNAL);

  for (const mapping of locationQueries) {
    const matchedService = SEO_CONFIG.primaryServices.find(
      (s) => keywordOverlap(s.label, mapping.query) >= 0.4 || keywordOverlap(mapping.query, s.label) >= 0.4
    );

    const score = computeOpportunityScore({
      impressions: mapping.totalImpressions,
      position: mapping.averagePosition,
      ctr: mapping.averageCtr,
      pageRelevance: mapping.pageRelevance,
      matchesLocation: true,
      matchesService: Boolean(matchedService),
    });

    const message = matchedService
      ? `"${mapping.query}" combines a target-market location with "${matchedService.label}" — a genuine local-SEO signal for that service page, not a reason to create a new location page.`
      : `"${mapping.query}" shows location-specific search demand (${mapping.totalImpressions} impressions) without a clearly matching service — worth reviewing whether an existing page addresses it.`;

    issues.push({
      type: "keyword-location-opportunity",
      source: "keyword-intelligence",
      severity: matchedService ? "warning" : "opportunity",
      category: "search-performance",
      page: mapping.primaryPage,
      query: mapping.query,
      searchIntent: mapping.searchIntent,
      opportunityScore: score,
      currentMetric: `${mapping.totalClicks} clicks, ${mapping.totalImpressions} impressions, avg position ${mapping.averagePosition.toFixed(1)}`,
      message,
    });
  }

  return issues;
}
