import { computeOpportunityScore } from "./opportunityScore";
import { detectCannibalization } from "./cannibalization";
import { detectServiceOpportunities } from "./serviceCoverage";
import { detectLocationOpportunities } from "./locationIntelligence";
import type { QueryPageMapping, QueryPageRow, SeoIssue } from "../types";

// STEP 4 Task 4 — the 8 deterministic opportunity rules, applied to the
// query→page mappings from Task 2. Rules 5, 7, and 8 are implemented in
// their own modules (cannibalization.ts, serviceCoverage.ts,
// locationIntelligence.ts) since each needs its own extra context (the
// raw rows, the real service list, the real location terms); this file
// implements rules 1, 2, 3, 4, and 6, which only need one query→page
// mapping each, and then combines everything into one list.

const RULES = {
  lowCtr: { minImpressions: 50, maxCtr: 0.02 },
  rankingImprovement: { minPosition: 4, maxPosition: 20, minRelevance: 0.3 },
  pageOptimization: { minImpressions: 50, minPosition: 11, maxPosition: 20 },
  successfulTopic: { minClicks: 10, maxPosition: 3 },
  relevanceInvestigate: { minRelevance: 0.5, minImpressions: 30, maxClicks: 1 },
} as const;

function detectQueryLevelOpportunities(mappings: QueryPageMapping[]): SeoIssue[] {
  const issues: SeoIssue[] = [];

  for (const m of mappings) {
    const scoreInput = { impressions: m.totalImpressions, position: m.averagePosition, ctr: m.averageCtr, pageRelevance: m.pageRelevance };

    // Rule 1 — high impressions + low CTR. Reuses the same issue TYPE
    // Step 3 already defined for this exact signal (gsc-high-impressions-
    // low-ctr) — this version is page-attributed (Task 1's query+page
    // data lets it name the actual ranking URL), which the Step 3
    // query-only version couldn't do.
    if (m.totalImpressions >= RULES.lowCtr.minImpressions && m.averageCtr < RULES.lowCtr.maxCtr) {
      issues.push({
        type: "gsc-high-impressions-low-ctr",
        source: "keyword-intelligence",
        severity: "warning",
        category: "search-performance",
        page: m.primaryPage,
        query: m.query,
        searchIntent: m.searchIntent,
        opportunityScore: computeOpportunityScore(scoreInput),
        currentMetric: `${m.totalImpressions} impressions, ${(m.averageCtr * 100).toFixed(1)}% CTR`,
        message: `"${m.query}" → ${m.primaryPage}: ${m.totalImpressions} impressions but only ${(m.averageCtr * 100).toFixed(1)}% CTR — title/meta description likely needs work.`,
      });
    }

    // Rule 2 — position 4-20 on a genuinely relevant page.
    if (m.averagePosition >= RULES.rankingImprovement.minPosition && m.averagePosition <= RULES.rankingImprovement.maxPosition && m.pageRelevance >= RULES.rankingImprovement.minRelevance) {
      issues.push({
        type: "keyword-ranking-improvement",
        source: "keyword-intelligence",
        severity: "opportunity",
        category: "search-performance",
        page: m.primaryPage,
        query: m.query,
        searchIntent: m.searchIntent,
        opportunityScore: computeOpportunityScore(scoreInput),
        currentMetric: `Position ${m.averagePosition.toFixed(1)}, ${m.totalImpressions} impressions`,
        message: `"${m.query}" → ${m.primaryPage}: relevant, ranking at position ${m.averagePosition.toFixed(1)} — a realistic ranking-improvement target.`,
      });
    }

    // Rule 3 — high impressions specifically in the page-2 band (11-20).
    if (m.totalImpressions >= RULES.pageOptimization.minImpressions && m.averagePosition >= RULES.pageOptimization.minPosition && m.averagePosition <= RULES.pageOptimization.maxPosition) {
      issues.push({
        type: "keyword-page-optimization",
        source: "keyword-intelligence",
        severity: "warning",
        category: "search-performance",
        page: m.primaryPage,
        query: m.query,
        searchIntent: m.searchIntent,
        opportunityScore: computeOpportunityScore(scoreInput),
        currentMetric: `${m.totalImpressions} impressions, position ${m.averagePosition.toFixed(1)}`,
        message: `"${m.query}" → ${m.primaryPage}: ${m.totalImpressions} impressions on page 2 of results (position ${m.averagePosition.toFixed(1)}) — on-page optimization could push it to page 1.`,
      });
    }

    // Rule 4 — already succeeding; a positive signal, not a problem.
    if (m.totalClicks >= RULES.successfulTopic.minClicks && m.averagePosition > 0 && m.averagePosition <= RULES.successfulTopic.maxPosition) {
      issues.push({
        type: "keyword-successful-topic",
        source: "keyword-intelligence",
        severity: "opportunity",
        category: "search-performance",
        page: m.primaryPage,
        query: m.query,
        searchIntent: m.searchIntent,
        currentMetric: `${m.totalClicks} clicks at position ${m.averagePosition.toFixed(1)}`,
        message: `"${m.query}" → ${m.primaryPage} is a successful topic (${m.totalClicks} clicks, position ${m.averagePosition.toFixed(1)}) — a good candidate to build more content/internal links around.`,
      });
    }

    // Rule 6 — relevant page, but real impressions aren't converting to clicks.
    if (m.pageRelevance >= RULES.relevanceInvestigate.minRelevance && m.totalImpressions >= RULES.relevanceInvestigate.minImpressions && m.totalClicks <= RULES.relevanceInvestigate.maxClicks) {
      issues.push({
        type: "keyword-relevance-investigate",
        source: "keyword-intelligence",
        severity: "warning",
        category: "search-performance",
        page: m.primaryPage,
        query: m.query,
        searchIntent: m.searchIntent,
        opportunityScore: computeOpportunityScore(scoreInput),
        currentMetric: `${m.totalClicks} clicks from ${m.totalImpressions} impressions (position ${m.averagePosition.toFixed(1)})`,
        message: `"${m.query}" → ${m.primaryPage}: relevant and gets real impressions, but almost no clicks — worth checking the actual SERP snippet and true search intent match.`,
      });
    }
  }

  return issues;
}

export function detectAllKeywordOpportunities(mappings: QueryPageMapping[], rows: QueryPageRow[]): SeoIssue[] {
  return [
    ...detectQueryLevelOpportunities(mappings), // Rules 1, 2, 3, 4, 6
    ...detectCannibalization(mappings, rows), // Rule 5
    ...detectServiceOpportunities(mappings), // Rule 7
    ...detectLocationOpportunities(mappings), // Rule 8
  ];
}
