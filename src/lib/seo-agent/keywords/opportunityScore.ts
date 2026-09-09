import type { OpportunityScore, OpportunityScoreFactor } from "../types";

// STEP 4 Task 8 — one consistent, transparent scoring formula applied to
// every keyword opportunity, regardless of which rule (Task 4) detected
// it. Every point is traceable to a named factor in the returned
// `factors` array — nothing here is a random or hidden number.
//
// Weights (sum to 100):
//   impressions        25  — is there an audience at all?
//   position headroom  25  — how much realistic ranking improvement is there?
//   CTR gap            20  — is the actual CTR below what this position typically earns?
//   page relevance     15  — does the ranking page actually match the query?
//   trend              10  — is this getting better or worse period-over-period? (optional signal)
//   business relevance  5  — does this match a real service/location this business offers?

function impressionsFactor(impressions: number): OpportunityScoreFactor {
  let contribution = 0;
  if (impressions >= 500) contribution = 25;
  else if (impressions >= 200) contribution = 18;
  else if (impressions >= 50) contribution = 10;
  else if (impressions >= 10) contribution = 5;
  return { factor: "impressions", weight: 25, contribution, explanation: `${impressions} impressions in the analyzed period.` };
}

function positionHeadroomFactor(position: number): OpportunityScoreFactor {
  let contribution = 0;
  let explanation = `Average position ${position.toFixed(1)}.`;
  if (position >= 4 && position <= 10) {
    contribution = 25;
    explanation += " Prime improvement range (page 1, not yet top 3) — usually the easiest real wins.";
  } else if (position > 10 && position <= 20) {
    contribution = 18;
    explanation += " Page 2 — reachable with on-page/content improvement.";
  } else if (position >= 2 && position < 4) {
    contribution = 10;
    explanation += " Already near the top — limited headroom left.";
  } else if (position > 20 && position <= 50) {
    contribution = 8;
    explanation += " Beyond page 2 — improvement is possible but less immediately reachable.";
  } else if (position < 2 && position > 0) {
    contribution = 2;
    explanation += " Already ranking #1 — essentially no headroom.";
  }
  return { factor: "position headroom", weight: 25, contribution, explanation };
}

// Rough, widely-cited industry CTR-by-position benchmarks — used only as
// a reference point to size the CTR gap, not presented as this site's
// own historical data.
function expectedCtrForPosition(position: number): number {
  if (position <= 1) return 0.28;
  if (position <= 2) return 0.15;
  if (position <= 3) return 0.11;
  if (position <= 6) return 0.07;
  if (position <= 10) return 0.03;
  return 0.01;
}

function ctrGapFactor(ctr: number, position: number): OpportunityScoreFactor {
  const expected = expectedCtrForPosition(position);
  const gap = Math.max(0, expected - ctr);
  const contribution = Math.round(Math.min(1, gap / expected) * 20);
  return {
    factor: "CTR gap",
    weight: 20,
    contribution,
    explanation: `Actual CTR ${(ctr * 100).toFixed(1)}% vs a typical ~${(expected * 100).toFixed(0)}% for position ${position.toFixed(1)}.`,
  };
}

function relevanceFactor(pageRelevance: number): OpportunityScoreFactor {
  const contribution = Math.round(pageRelevance * 15);
  return { factor: "page relevance", weight: 15, contribution, explanation: `${Math.round(pageRelevance * 100)}% keyword overlap between the query and the ranking page's title/H1/URL.` };
}

function trendFactor(clicksChangePct: number | null): OpportunityScoreFactor {
  if (clicksChangePct === null) {
    return { factor: "trend", weight: 10, contribution: 5, explanation: "No prior-period comparison available for this query — neutral score." };
  }
  // A decline raises urgency (more points); growth is a good sign, so it
  // lowers the "needs attention" contribution without going to zero
  // (still worth monitoring).
  const contribution = clicksChangePct < 0 ? Math.round(Math.min(1, Math.abs(clicksChangePct) / 50) * 10) : Math.max(0, 5 - Math.round((clicksChangePct / 50) * 5));
  const direction = clicksChangePct < 0 ? "down" : "up";
  return { factor: "trend", weight: 10, contribution, explanation: `Clicks ${direction} ${Math.abs(clicksChangePct).toFixed(0)}% vs the previous period.` };
}

function businessRelevanceFactor(matchesService: boolean, matchesLocation: boolean): OpportunityScoreFactor {
  const contribution = matchesService && matchesLocation ? 5 : matchesService || matchesLocation ? 3 : 0;
  const parts = [matchesService && "an existing service", matchesLocation && "a target location (UK/Pakistan)"].filter(Boolean);
  const explanation = parts.length > 0 ? `Query relates to ${parts.join(" and ")}.` : "No clear match to an existing service or target location.";
  return { factor: "business relevance", weight: 5, contribution, explanation };
}

export function computeOpportunityScore(input: {
  impressions: number;
  position: number;
  ctr: number;
  pageRelevance: number;
  clicksChangePct?: number | null;
  matchesService?: boolean;
  matchesLocation?: boolean;
}): OpportunityScore {
  const factors = [
    impressionsFactor(input.impressions),
    positionHeadroomFactor(input.position),
    ctrGapFactor(input.ctr, input.position),
    relevanceFactor(input.pageRelevance),
    trendFactor(input.clicksChangePct ?? null),
    businessRelevanceFactor(input.matchesService ?? false, input.matchesLocation ?? false),
  ];
  const score = factors.reduce((sum, f) => sum + f.contribution, 0);
  return { score: Math.max(0, Math.min(100, score)), factors };
}
