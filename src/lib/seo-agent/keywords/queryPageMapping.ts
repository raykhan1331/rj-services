import { classifySearchIntent } from "./intentClassifier";
import { keywordOverlap, pageRelevanceText } from "./relevance";
import type { PageRecord, QueryPageMapping, QueryPageRow } from "../types";

// STEP 4 Task 2 — groups the raw query+page+country+device rows (Task 1)
// by query, and determines which page is primarily responsible for each
// query's performance, using the real crawled page data from STEP 1/2
// (src/lib/seo-agent/store.ts's PageRecord) rather than inventing a
// second source of page metadata.

function urlToPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function buildQueryPageMappings(rows: QueryPageRow[], pages: PageRecord[]): QueryPageMapping[] {
  const pageByPath = new Map(pages.map((p) => [p.path, p]));

  const byQuery = new Map<string, QueryPageRow[]>();
  for (const row of rows) {
    byQuery.set(row.query, [...(byQuery.get(row.query) ?? []), row]);
  }

  const mappings: QueryPageMapping[] = [];

  for (const [query, queryRows] of byQuery) {
    // Aggregate per-page first (a query can have many country/device rows
    // for the same page) so "which page wins" is decided on real totals.
    const byPage = new Map<string, { clicks: number; impressions: number; positionWeightedSum: number }>();
    for (const row of queryRows) {
      const existing = byPage.get(row.page) ?? { clicks: 0, impressions: 0, positionWeightedSum: 0 };
      existing.clicks += row.clicks;
      existing.impressions += row.impressions;
      existing.positionWeightedSum += row.position * row.impressions;
      byPage.set(row.page, existing);
    }

    const competingPages = Array.from(byPage.keys());
    const [primaryPageUrl] = Array.from(byPage.entries()).sort((a, b) => b[1].clicks - a[1].clicks || b[1].impressions - a[1].impressions)[0];

    const totalClicks = queryRows.reduce((sum, r) => sum + r.clicks, 0);
    const totalImpressions = queryRows.reduce((sum, r) => sum + r.impressions, 0);
    const positionWeightedSum = queryRows.reduce((sum, r) => sum + r.position * r.impressions, 0);
    const averagePosition = totalImpressions > 0 ? positionWeightedSum / totalImpressions : 0;
    const averageCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

    const primaryPath = urlToPath(primaryPageUrl);
    const primaryPageRecord = pageByPath.get(primaryPath);
    const relevanceTarget = primaryPageRecord
      ? pageRelevanceText({ title: primaryPageRecord.title, h1s: primaryPageRecord.headings.h1s, path: primaryPageRecord.path })
      : primaryPath.replace(/[-/]/g, " ");

    mappings.push({
      query,
      searchIntent: classifySearchIntent(query),
      primaryPage: primaryPath,
      totalClicks,
      totalImpressions,
      averageCtr,
      averagePosition,
      competingPages: competingPages.map(urlToPath),
      pageRelevance: keywordOverlap(query, relevanceTarget),
    });
  }

  return mappings.sort((a, b) => b.totalClicks - a.totalClicks || b.totalImpressions - a.totalImpressions);
}
