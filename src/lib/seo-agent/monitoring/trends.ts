import type { GscPeriodComparison, SeoReportHistoryEntry, TrendDirection, TrendMetric } from "../types";

// STEP 10 Task 6 — trend lines built from EXISTING data: the new
// lightweight report-history snapshot (Task 10) for score/issue/change
// counts, and STEP 3's already-computed GscPeriodComparison.change
// percentages for search metrics (never recomputed here). Never shows a
// misleading percentage when the baseline is zero/unavailable.

function trend(metric: string, current: number | null, previous: number | null, higherIsBetter: boolean, percentOverride?: number | null): TrendMetric {
  if (current === null || previous === null) {
    return { metric, current, previous, difference: null, percentChange: null, direction: "unknown" };
  }
  const difference = current - previous;
  const percentChange = percentOverride !== undefined ? percentOverride : previous === 0 ? null : (difference / previous) * 100;
  let direction: TrendDirection = "stable";
  if (Math.abs(difference) > 0.001) {
    direction = (higherIsBetter ? difference > 0 : difference < 0) ? "improving" : "declining";
  }
  return { metric, current, previous, difference, percentChange, direction };
}

export function computeTrends(current: SeoReportHistoryEntry | null, previous: SeoReportHistoryEntry | null, gscComparison: GscPeriodComparison | null): TrendMetric[] {
  if (!current) return [];
  const prev = previous;

  const trends: TrendMetric[] = [
    trend("Overall SEO Score", current.overallScore, prev?.overallScore ?? null, true),
    trend("SEO Health Score", current.healthScore, prev?.healthScore ?? null, true),
    trend("Technical Score", current.technicalScore, prev?.technicalScore ?? null, true),
    trend("On-Page Score", current.onPageScore, prev?.onPageScore ?? null, true),
    trend("Technical Issues (critical + warning)", current.criticalCount + current.warningCount, prev ? prev.criticalCount + prev.warningCount : null, false),
    trend("Pending Recommendations", current.pendingApprovals, prev?.pendingApprovals ?? null, false),
    trend("Completed Changes", current.completedChanges, prev?.completedChanges ?? null, true),
    trend("Failed Changes", current.failedChanges, prev?.failedChanges ?? null, false),
  ];

  if (gscComparison) {
    trends.push(
      trend("Search Clicks", gscComparison.current.totalClicks, gscComparison.previous.totalClicks, true, gscComparison.change.clicksPct),
      trend("Search Impressions", gscComparison.current.totalImpressions, gscComparison.previous.totalImpressions, true, gscComparison.change.impressionsPct),
      trend("Average CTR", gscComparison.current.averageCtr, gscComparison.previous.averageCtr, true, gscComparison.change.ctrPct),
      // Position is "lower is better" — see Step 3's own dateRanges.ts/performance.ts comment on this same convention.
      trend("Average Position", gscComparison.current.averagePosition, gscComparison.previous.averagePosition, false, gscComparison.change.positionPct)
    );
  }

  return trends;
}
