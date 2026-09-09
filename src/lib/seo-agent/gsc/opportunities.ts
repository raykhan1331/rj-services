import type { GscPeriodComparison, GscRow, SeoIssue } from "../types";

// STEP 3 Task 4 — deterministic rules only, exactly the five examples
// given: high-impressions/low-CTR, good-impressions/poor-position,
// declining clicks, declining impressions, and high-performing-page
// link opportunities. No AI, no automatic changes — every rule below
// only ever produces a SeoIssue (source: "search-console") that flows
// into the same STEP 2 action queue as a "pending" recommendation.

const RULES = {
  highImpressionsLowCtr: { minImpressions: 50, maxCtr: 0.02 }, // < 2% CTR
  goodImpressionsPoorPosition: { minImpressions: 30, minPosition: 15 }, // ranking beyond page 1-2
  decline: { minPct: 20, minBaseline: 10 }, // a 20%+ drop, ignored below a baseline of 10 to avoid noise from tiny numbers
  highPerformer: { maxPosition: 3, minClicks: 10 },
} as const;

function pct(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  return `${(n * 100).toFixed(1)}%`;
}

function metricSummary(row: GscRow): string {
  return `${row.clicks} clicks, ${row.impressions} impressions, ${pct(row.ctr)} CTR, avg position ${row.position.toFixed(1)}`;
}

function urlToPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function detectQueryOpportunities(comparison: GscPeriodComparison): SeoIssue[] {
  const issues: SeoIssue[] = [];

  for (const row of comparison.current.topQueries) {
    const query = row.keys[0];

    if (row.impressions >= RULES.highImpressionsLowCtr.minImpressions && row.ctr < RULES.highImpressionsLowCtr.maxCtr) {
      issues.push({
        type: "gsc-high-impressions-low-ctr",
        source: "search-console",
        severity: "warning",
        category: "search-performance",
        query,
        currentMetric: metricSummary(row),
        message: `Query "${query}" gets ${row.impressions} impressions but only ${pct(row.ctr)} CTR — the title/meta description may not be compelling enough.`,
      });
    }

    if (row.impressions >= RULES.goodImpressionsPoorPosition.minImpressions && row.position > RULES.goodImpressionsPoorPosition.minPosition) {
      issues.push({
        type: "gsc-poor-position",
        source: "search-console",
        severity: "opportunity",
        category: "search-performance",
        query,
        currentMetric: metricSummary(row),
        message: `Query "${query}" gets ${row.impressions} impressions but ranks at position ${row.position.toFixed(1)} — on-page content may need strengthening.`,
      });
    }
  }

  return issues;
}

export function detectPageOpportunities(comparison: GscPeriodComparison): SeoIssue[] {
  const issues: SeoIssue[] = [];

  const previousByUrl = new Map(comparison.previous.topPages.map((r) => [r.keys[0], r]));

  for (const row of comparison.current.topPages) {
    const url = row.keys[0];
    const path = urlToPath(url);

    if (row.position <= RULES.highPerformer.maxPosition && row.clicks >= RULES.highPerformer.minClicks) {
      issues.push({
        type: "gsc-high-performer-link-opportunity",
        source: "search-console",
        severity: "opportunity",
        category: "search-performance",
        page: path,
        currentMetric: metricSummary(row),
        message: `${path} is a top performer (position ${row.position.toFixed(1)}, ${row.clicks} clicks) — a good candidate to link to/from more.`,
      });
    }

    const previous = previousByUrl.get(url);
    if (previous && previous.clicks >= RULES.decline.minBaseline) {
      const dropPct = ((previous.clicks - row.clicks) / previous.clicks) * 100;
      if (dropPct >= RULES.decline.minPct) {
        issues.push({
          type: "gsc-declining-clicks",
          source: "search-console",
          severity: "warning",
          category: "search-performance",
          page: path,
          currentMetric: `${row.clicks} clicks this period vs ${previous.clicks} previous period (-${dropPct.toFixed(0)}%)`,
          message: `${path} clicks dropped ${dropPct.toFixed(0)}% period-over-period — worth investigating.`,
        });
      }
    }

    if (previous && previous.impressions >= RULES.decline.minBaseline) {
      const dropPct = ((previous.impressions - row.impressions) / previous.impressions) * 100;
      if (dropPct >= RULES.decline.minPct) {
        issues.push({
          type: "gsc-declining-impressions",
          source: "search-console",
          severity: "warning",
          category: "search-performance",
          page: path,
          currentMetric: `${row.impressions} impressions this period vs ${previous.impressions} previous period (-${dropPct.toFixed(0)}%)`,
          message: `${path} impressions dropped ${dropPct.toFixed(0)}% period-over-period — visibility may be declining.`,
        });
      }
    }
  }

  return issues;
}

/** Site-wide (not per-page) decline check, for when the drop is broad
 * rather than concentrated on one page. */
export function detectSiteWideDecline(comparison: GscPeriodComparison): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const { current, previous } = comparison;

  if (previous.totalClicks >= RULES.decline.minBaseline) {
    const dropPct = ((previous.totalClicks - current.totalClicks) / previous.totalClicks) * 100;
    if (dropPct >= RULES.decline.minPct) {
      issues.push({
        type: "gsc-declining-clicks",
        source: "search-console",
        severity: "critical",
        category: "search-performance",
        currentMetric: `${current.totalClicks} total clicks this period vs ${previous.totalClicks} previous period (-${dropPct.toFixed(0)}%)`,
        message: `Site-wide organic clicks dropped ${dropPct.toFixed(0)}% period-over-period.`,
      });
    }
  }

  if (previous.totalImpressions >= RULES.decline.minBaseline) {
    const dropPct = ((previous.totalImpressions - current.totalImpressions) / previous.totalImpressions) * 100;
    if (dropPct >= RULES.decline.minPct) {
      issues.push({
        type: "gsc-declining-impressions",
        source: "search-console",
        severity: "critical",
        category: "search-performance",
        currentMetric: `${current.totalImpressions} total impressions this period vs ${previous.totalImpressions} previous period (-${dropPct.toFixed(0)}%)`,
        message: `Site-wide search visibility (impressions) dropped ${dropPct.toFixed(0)}% period-over-period.`,
      });
    }
  }

  return issues;
}

export function detectAllGscOpportunities(comparison: GscPeriodComparison): SeoIssue[] {
  return [
    ...detectSiteWideDecline(comparison),
    ...detectQueryOpportunities(comparison),
    ...detectPageOpportunities(comparison),
  ];
}
