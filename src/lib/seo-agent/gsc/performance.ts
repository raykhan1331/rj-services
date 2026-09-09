import { querySearchAnalytics } from "./client";
import { getDefaultRange, getPreviousRange } from "./dateRanges";
import type { GscDateRange, GscPeriodComparison, GscPerformanceSummary, GscRow, QueryPageRow } from "../types";

// STEP 3 Task 3 — pulls every performance breakdown the task asks for:
// totals, top queries, top pages, country, device, and search appearance.
// A property with no traffic in range legitimately returns empty arrays
// here — that's surfaced as-is, not treated as an error (see
// gsc/errors.ts's "no-data-yet", which callers can report separately if
// every array comes back empty).

function summarizeTotals(rows: GscRow[]): { clicks: number; impressions: number; ctr: number; position: number } {
  if (rows.length === 0) return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const row = rows[0];
  return { clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position };
}

export async function fetchPerformanceSummary(propertyUrl: string, range: GscDateRange): Promise<GscPerformanceSummary> {
  const [totalsRows, topQueries, topPages, byCountry, byDevice, bySearchAppearance] = await Promise.all([
    querySearchAnalytics(propertyUrl, { ...range, dimensions: [], rowLimit: 1 }),
    querySearchAnalytics(propertyUrl, { ...range, dimensions: ["query"], rowLimit: 25 }),
    querySearchAnalytics(propertyUrl, { ...range, dimensions: ["page"], rowLimit: 25 }),
    querySearchAnalytics(propertyUrl, { ...range, dimensions: ["country"], rowLimit: 10 }),
    querySearchAnalytics(propertyUrl, { ...range, dimensions: ["device"], rowLimit: 10 }),
    querySearchAnalytics(propertyUrl, { ...range, dimensions: ["searchAppearance"], rowLimit: 10 }),
  ]);

  const totals = summarizeTotals(totalsRows);

  return {
    range,
    totalClicks: totals.clicks,
    totalImpressions: totals.impressions,
    averageCtr: totals.ctr,
    averagePosition: totals.position,
    topQueries,
    topPages,
    byCountry,
    byDevice,
    bySearchAppearance,
  };
}

// STEP 4 Task 1 — the combined query+page+country+device breakdown that
// keyword intelligence needs (which page ranks for which query, not just
// two separate query-only/page-only lists). Reuses querySearchAnalytics
// (STEP 3) rather than adding a second API-calling path — this is a new
// dimension COMBINATION on the existing client, not a new client.
export async function fetchQueryPageBreakdown(propertyUrl: string, range: GscDateRange, rowLimit = 500): Promise<QueryPageRow[]> {
  const rows = await querySearchAnalytics(propertyUrl, { ...range, dimensions: ["query", "page", "country", "device"], rowLimit });
  return rows.map((r) => ({
    query: r.keys[0],
    page: r.keys[1],
    country: r.keys[2],
    device: r.keys[3],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null; // undefined % change from zero — report as null rather than a misleading Infinity/huge number
  return ((current - previous) / previous) * 100;
}

export async function fetchPeriodComparison(propertyUrl: string): Promise<GscPeriodComparison> {
  const currentRange = getDefaultRange();
  const previousRange = getPreviousRange(currentRange);

  const [current, previous] = await Promise.all([
    fetchPerformanceSummary(propertyUrl, currentRange),
    fetchPerformanceSummary(propertyUrl, previousRange),
  ]);

  return {
    current,
    previous,
    change: {
      clicksPct: pctChange(current.totalClicks, previous.totalClicks),
      impressionsPct: pctChange(current.totalImpressions, previous.totalImpressions),
      ctrPct: pctChange(current.averageCtr, previous.averageCtr),
      // Position is "lower is better" — report the raw percentage change
      // (a negative value means position improved/decreased) rather than
      // inverting it, so it's unambiguous when read next to the raw numbers.
      positionPct: pctChange(current.averagePosition, previous.averagePosition),
    },
  };
}
