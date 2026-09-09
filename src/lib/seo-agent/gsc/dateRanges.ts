import type { GscDateRange } from "../types";

// STEP 3 Task 3 — Search Console data typically lags 2-3 days behind
// real time (Google's own documented behavior), so "today" is never a
// reliable end date — the most recent couple of days would show
// artificially low numbers because they simply haven't finished
// processing yet, not because performance actually dropped.
const DATA_LAG_DAYS = 3;
const PERIOD_LENGTH_DAYS = 28;

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

/** The default reporting period: the most recent complete 28 days,
 * ending DATA_LAG_DAYS ago rather than today. */
export function getDefaultRange(): GscDateRange {
  const end = addDays(new Date(), -DATA_LAG_DAYS);
  const start = addDays(end, -(PERIOD_LENGTH_DAYS - 1));
  return { startDate: toISODate(start), endDate: toISODate(end) };
}

/** The 28-day period immediately preceding `range`, for period-over-period
 * comparison (Task 3's "also prepare comparison with the previous 28-day
 * period"). */
export function getPreviousRange(range: GscDateRange): GscDateRange {
  const currentStart = new Date(range.startDate);
  const previousEnd = addDays(currentStart, -1);
  const previousStart = addDays(previousEnd, -(PERIOD_LENGTH_DAYS - 1));
  return { startDate: toISODate(previousStart), endDate: toISODate(previousEnd) };
}
