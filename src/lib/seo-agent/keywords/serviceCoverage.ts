import { SEO_CONFIG } from "../config";
import { computeOpportunityScore } from "./opportunityScore";
import { keywordOverlap } from "./relevance";
import type { QueryPageMapping, SeoIssue } from "../types";

// STEP 4 Task 6 — compares real Search Console queries against the
// site's REAL services (SEO_CONFIG.primaryServices, sourced from
// src/lib/nav.ts in STEP 1 — never invented here). Only ever produces
// recommendations; never creates a page.

const MIN_OVERLAP_TO_COUNT_AS_RELATED = 0.4; // at least 40% of the query's meaningful words match the service label
const MIN_IMPRESSIONS_FOR_DEMAND_SIGNAL = 30;

export function detectServiceOpportunities(mappings: QueryPageMapping[]): SeoIssue[] {
  const issues: SeoIssue[] = [];

  for (const service of SEO_CONFIG.primaryServices) {
    const relatedQueries = mappings.filter((m) => keywordOverlap(service.label, m.query) >= MIN_OVERLAP_TO_COUNT_AS_RELATED || keywordOverlap(m.query, service.label) >= MIN_OVERLAP_TO_COUNT_AS_RELATED);

    if (relatedQueries.length === 0) {
      // A genuine coverage gap — no query data matched this service at
      // all in the analyzed period. Reported honestly with no fabricated
      // metric, as its own (low-severity) opportunity, not auto-acted on.
      issues.push({
        type: "keyword-service-match",
        source: "keyword-intelligence",
        severity: "opportunity",
        category: "search-performance",
        page: service.href,
        message: `No Search Console queries matched "${service.label}" in the analyzed period — either genuinely low search demand, or the existing page(s) aren't yet ranking for relevant terms.`,
        currentMetric: "No matching queries found",
      });
      continue;
    }

    const totalImpressions = relatedQueries.reduce((sum, m) => sum + m.totalImpressions, 0);
    const totalClicks = relatedQueries.reduce((sum, m) => sum + m.totalClicks, 0);
    const weightedPosition = relatedQueries.reduce((sum, m) => sum + m.averagePosition * m.totalImpressions, 0);
    const avgPosition = totalImpressions > 0 ? weightedPosition / totalImpressions : 0;
    const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    const bestMapping = relatedQueries.reduce((a, b) => (b.totalClicks > a.totalClicks ? b : a));

    const strongVisibility = avgPosition > 0 && avgPosition <= 10 && totalClicks > 0;
    const weakRankingDespiteDemand = totalImpressions >= MIN_IMPRESSIONS_FOR_DEMAND_SIGNAL && avgPosition > 10;

    if (strongVisibility) {
      // Not a problem — a positive signal worth surfacing (Task 6's
      // "services already receiving search visibility"), low severity.
      issues.push({
        type: "keyword-service-match",
        source: "keyword-intelligence",
        severity: "opportunity",
        category: "search-performance",
        page: bestMapping.primaryPage,
        query: bestMapping.query,
        searchIntent: bestMapping.searchIntent,
        currentMetric: `${totalClicks} clicks, ${totalImpressions} impressions across ${relatedQueries.length} related quer${relatedQueries.length === 1 ? "y" : "ies"}, avg position ${avgPosition.toFixed(1)}`,
        message: `"${service.label}" already has real search visibility — a candidate for more internal links and possibly expanded content to reinforce it.`,
      });
    } else if (weakRankingDespiteDemand) {
      const score = computeOpportunityScore({
        impressions: totalImpressions,
        position: avgPosition,
        ctr: avgCtr,
        pageRelevance: bestMapping.pageRelevance,
        matchesService: true,
      });
      issues.push({
        type: "keyword-service-match",
        source: "keyword-intelligence",
        severity: "warning",
        category: "search-performance",
        page: bestMapping.primaryPage,
        query: bestMapping.query,
        searchIntent: bestMapping.searchIntent,
        opportunityScore: score,
        currentMetric: `${totalImpressions} impressions but avg position ${avgPosition.toFixed(1)} across ${relatedQueries.length} related quer${relatedQueries.length === 1 ? "y" : "ies"}`,
        message: `"${service.label}" has real search demand (${totalImpressions} impressions) but ranks poorly (position ${avgPosition.toFixed(1)}) — a page-optimization opportunity for this service page.`,
      });
    }
  }

  return issues;
}
