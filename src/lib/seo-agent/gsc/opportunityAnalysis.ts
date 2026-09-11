import type { GscOpportunity, GscOpportunityMetrics, GscOpportunityAnalysis, GscPeriodComparison, GscRow } from "../types";

// STEP 12 — deterministic, rule-based analysis over the SAME
// GscPeriodComparison data /api/seo-agent/gsc/performance already
// fetches (no new Google API call, no change to that endpoint). Every
// rule only fires above a real-data threshold, so zero/sparse data
// (e.g. a newly-verified property) correctly produces zero
// opportunities rather than a manufactured one — see hasSufficientData
// below and each rule's own minimum-impressions/clicks gate.

const THRESHOLDS = {
  highImpressionsLowCtr: { minImpressions: 50, maxCtr: 0.02 },
  nearPageOne: { minPosition: 4, maxPosition: 10, minImpressions: 20 },
  poorPosition: { minImpressions: 30, minPosition: 15 },
  pageWeakEngagement: { minImpressions: 30, maxCtr: 0.01 },
  decline: { minPct: 20, minBaseline: 10 },
  highPerformer: { maxPosition: 3, minClicks: 10 },
} as const;

let counter = 0;
function makeId(type: string): string {
  counter += 1;
  return `gsc-opp:${type}:${Date.now()}:${counter}`;
}

/** Confidence scales with how much real signal (impressions/clicks)
 * backs the finding — more volume means the pattern is less likely to
 * be noise. Deterministic, always re-derivable from the same inputs. */
function confidenceFromVolume(volume: number, strong: number, weak: number): number {
  if (volume >= strong) return 95;
  if (volume <= weak) return 50;
  const ratio = (volume - weak) / (strong - weak);
  return Math.round(50 + ratio * 45);
}

function urlToPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function pctLabel(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function detectQueryOpportunities(rows: GscRow[], now: string): GscOpportunity[] {
  const opportunities: GscOpportunity[] = [];

  for (const row of rows) {
    const query = row.keys[0];
    const metrics: GscOpportunityMetrics = { clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position };

    if (row.impressions >= THRESHOLDS.highImpressionsLowCtr.minImpressions && row.ctr < THRESHOLDS.highImpressionsLowCtr.maxCtr) {
      opportunities.push({
        id: makeId("high-impressions-low-ctr"),
        opportunityType: "high-impressions-low-ctr",
        affected: { query },
        metrics,
        whyItMatters: `This query already gets ${row.impressions} real impressions but only ${pctLabel(row.ctr)} of searchers click through — that's a real, existing audience not converting to visits.`,
        recommendedAction: "Improve the title tag and meta description for the page ranking on this query to make it more compelling in search results.",
        priority: row.impressions >= 200 ? "high" : "medium",
        confidence: confidenceFromVolume(row.impressions, 200, THRESHOLDS.highImpressionsLowCtr.minImpressions),
        source: "google-search-console",
        detectedAt: now,
      });
    }

    if (
      row.impressions >= THRESHOLDS.nearPageOne.minImpressions &&
      row.position >= THRESHOLDS.nearPageOne.minPosition &&
      row.position <= THRESHOLDS.nearPageOne.maxPosition
    ) {
      opportunities.push({
        id: makeId("near-page-one-position"),
        opportunityType: "near-page-one-position",
        affected: { query },
        metrics,
        whyItMatters: `Ranking at position ${row.position.toFixed(1)} with ${row.impressions} impressions — this is page 1 but not yet the top 3, usually the easiest real ranking gains available.`,
        recommendedAction: "Strengthen on-page content depth and internal links pointing to the ranking page to push this query further up page 1.",
        priority: "high",
        confidence: confidenceFromVolume(row.impressions, 100, THRESHOLDS.nearPageOne.minImpressions),
        source: "google-search-console",
        detectedAt: now,
      });
    }

    if (row.impressions >= THRESHOLDS.poorPosition.minImpressions && row.position > THRESHOLDS.poorPosition.minPosition) {
      opportunities.push({
        id: makeId("poor-position"),
        opportunityType: "poor-position",
        affected: { query },
        metrics,
        whyItMatters: `${row.impressions} impressions at position ${row.position.toFixed(1)} — real search demand exists, but ranking is currently too low for meaningful clicks.`,
        recommendedAction: "Review on-page content relevance and depth for this query; consider a dedicated section or page if none currently targets it well.",
        priority: "medium",
        confidence: confidenceFromVolume(row.impressions, 150, THRESHOLDS.poorPosition.minImpressions),
        source: "google-search-console",
        detectedAt: now,
      });
    }
  }

  return opportunities;
}

function detectPageOpportunities(comparison: GscPeriodComparison, now: string): GscOpportunity[] {
  const opportunities: GscOpportunity[] = [];
  const previousByUrl = new Map(comparison.previous.topPages.map((r) => [r.keys[0], r]));

  for (const row of comparison.current.topPages) {
    const url = row.keys[0];
    const page = urlToPath(url);
    const metrics: GscOpportunityMetrics = { clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position };

    if (row.impressions >= THRESHOLDS.pageWeakEngagement.minImpressions && row.ctr < THRESHOLDS.pageWeakEngagement.maxCtr) {
      opportunities.push({
        id: makeId("page-weak-engagement"),
        opportunityType: "page-weak-engagement",
        affected: { page },
        metrics,
        whyItMatters: `${page} receives ${row.impressions} impressions across its ranking queries but converts only ${pctLabel(row.ctr)} to clicks — visibility exists, engagement doesn't.`,
        recommendedAction: "Review this page's title/meta description and how well it matches what searchers are actually looking for.",
        priority: row.impressions >= 150 ? "high" : "medium",
        confidence: confidenceFromVolume(row.impressions, 150, THRESHOLDS.pageWeakEngagement.minImpressions),
        source: "google-search-console",
        detectedAt: now,
      });
    }

    if (row.position <= THRESHOLDS.highPerformer.maxPosition && row.clicks >= THRESHOLDS.highPerformer.minClicks) {
      opportunities.push({
        id: makeId("high-performer-link-opportunity"),
        opportunityType: "high-performer-link-opportunity",
        affected: { page },
        metrics,
        whyItMatters: `${page} is already a strong performer (position ${row.position.toFixed(1)}, ${row.clicks} real clicks) — a good candidate to link to/from more to spread its authority.`,
        recommendedAction: "Add internal links from related pages to this page, and consider linking out from it to relevant supporting content.",
        priority: "low",
        confidence: confidenceFromVolume(row.clicks, 30, THRESHOLDS.highPerformer.minClicks),
        source: "google-search-console",
        detectedAt: now,
      });
    }

    const previous = previousByUrl.get(url);
    if (previous && previous.clicks >= THRESHOLDS.decline.minBaseline) {
      const dropPct = ((previous.clicks - row.clicks) / previous.clicks) * 100;
      if (dropPct >= THRESHOLDS.decline.minPct) {
        opportunities.push({
          id: makeId("declining-page-clicks"),
          opportunityType: "declining-page-clicks",
          affected: { page },
          metrics: { ...metrics, previousClicks: previous.clicks, changePct: -dropPct },
          whyItMatters: `${page} clicks dropped ${dropPct.toFixed(0)}% period-over-period (${previous.clicks} → ${row.clicks}) — a real, measured decline, not noise.`,
          recommendedAction: "Investigate whether rankings shifted for this page's main queries, or whether the content needs refreshing.",
          priority: dropPct >= 50 ? "critical" : "high",
          confidence: confidenceFromVolume(previous.clicks, 30, THRESHOLDS.decline.minBaseline),
          source: "google-search-console",
          detectedAt: now,
        });
      }
    }

    if (previous && previous.impressions >= THRESHOLDS.decline.minBaseline) {
      const dropPct = ((previous.impressions - row.impressions) / previous.impressions) * 100;
      if (dropPct >= THRESHOLDS.decline.minPct) {
        opportunities.push({
          id: makeId("declining-page-impressions"),
          opportunityType: "declining-page-impressions",
          affected: { page },
          metrics: { ...metrics, previousImpressions: previous.impressions, changePct: -dropPct },
          whyItMatters: `${page} impressions dropped ${dropPct.toFixed(0)}% period-over-period (${previous.impressions} → ${row.impressions}) — visibility itself may be declining, not just engagement.`,
          recommendedAction: "Check for indexability issues (noindex, canonical, removal from sitemap) and whether rankings dropped for this page's queries.",
          priority: dropPct >= 50 ? "critical" : "high",
          confidence: confidenceFromVolume(previous.impressions, 30, THRESHOLDS.decline.minBaseline),
          source: "google-search-console",
          detectedAt: now,
        });
      }
    }
  }

  return opportunities;
}

function detectSiteWideOpportunities(comparison: GscPeriodComparison, now: string): GscOpportunity[] {
  const opportunities: GscOpportunity[] = [];
  const { current, previous } = comparison;

  if (previous.totalClicks >= THRESHOLDS.decline.minBaseline) {
    const dropPct = ((previous.totalClicks - current.totalClicks) / previous.totalClicks) * 100;
    if (dropPct >= THRESHOLDS.decline.minPct) {
      opportunities.push({
        id: makeId("declining-site-clicks"),
        opportunityType: "declining-site-clicks",
        affected: {},
        metrics: { clicks: current.totalClicks, previousClicks: previous.totalClicks, changePct: -dropPct },
        whyItMatters: `Site-wide organic clicks dropped ${dropPct.toFixed(0)}% period-over-period — a broad decline, not concentrated on one page.`,
        recommendedAction: "Check Search Console for manual actions, broad indexing issues, or a recent site-wide technical change.",
        priority: "critical",
        confidence: confidenceFromVolume(previous.totalClicks, 100, THRESHOLDS.decline.minBaseline),
        source: "google-search-console",
        detectedAt: now,
      });
    }
  }

  if (previous.totalImpressions >= THRESHOLDS.decline.minBaseline) {
    const dropPct = ((previous.totalImpressions - current.totalImpressions) / previous.totalImpressions) * 100;
    if (dropPct >= THRESHOLDS.decline.minPct) {
      opportunities.push({
        id: makeId("declining-site-impressions"),
        opportunityType: "declining-site-impressions",
        affected: {},
        metrics: { impressions: current.totalImpressions, previousImpressions: previous.totalImpressions, changePct: -dropPct },
        whyItMatters: `Site-wide search impressions dropped ${dropPct.toFixed(0)}% period-over-period — overall search visibility may be declining.`,
        recommendedAction: "Check crawlability/indexability site-wide (robots.txt, sitemap, noindex tags) for an unintended blanket change.",
        priority: "critical",
        confidence: confidenceFromVolume(previous.totalImpressions, 100, THRESHOLDS.decline.minBaseline),
        source: "google-search-console",
        detectedAt: now,
      });
    }
  }

  return opportunities;
}

export function analyzeGscOpportunities(comparison: GscPeriodComparison, propertyUrl: string): GscOpportunityAnalysis {
  const now = new Date().toISOString();
  const hasUnderlyingData = comparison.current.totalClicks > 0 || comparison.current.totalImpressions > 0;

  const opportunities = hasUnderlyingData
    ? [
        ...detectSiteWideOpportunities(comparison, now),
        ...detectQueryOpportunities(comparison.current.topQueries, now),
        ...detectPageOpportunities(comparison, now),
      ]
    : []; // honest empty state — never manufacture opportunities from zero data

  return {
    generatedAt: now,
    dateRange: comparison.current.range,
    propertyUrl,
    hasUnderlyingData,
    opportunities,
  };
}
