import { getDecryptedTokens } from "../gsc/tokenStore";
import { GscError } from "../gsc/errors";
import { fetchQueryPageBreakdown } from "../gsc/performance";
import { getDefaultRange } from "../gsc/dateRanges";
import { buildQueryPageMappings } from "./queryPageMapping";
import { detectAllKeywordOpportunities } from "./opportunities";
import { readPages, reconcileIssues, reconcileActions } from "../store";
import { toIssueRecord, generateActionQueue } from "../actionQueue";
import { saveLatestKeywordSummary } from "./store";
import type { KeywordIntelligenceSummary, KeywordOpportunitySummaryItem, KeywordSummaryRow, QueryPageMapping, SearchIntent, SeoIssue, SeoIssueType } from "../types";

// STEP 4 Task 9/10/13 — the top-level orchestrator: pulls the real
// query+page breakdown (Task 1) from the same connected Search Console
// property Step 3 already authenticated, maps it onto real crawled pages
// (Task 2, reusing the Step 1/2 crawler store — no second page source),
// runs the 8 deterministic rules (Task 4), then reconciles the results
// into the shared STEP 2 issue/action-queue store scoped to
// source: "keyword-intelligence" (so this run never touches audit or
// search-console issues — see store.ts's reconcileIssues/reconcileActions
// comments), forcing every resulting action to "review-required" (Task 9
// — no exceptions). Finally persists a KeywordIntelligenceSummary so the
// dashboard (Task 10) can read it without re-running the analysis.

export interface KeywordAnalysisResult {
  mappings: QueryPageMapping[];
  issues: SeoIssue[];
  summary: KeywordIntelligenceSummary;
}

const EMPTY_INTENT_BREAKDOWN: Record<SearchIntent, number> = {
  informational: 0,
  commercial: 0,
  transactional: 0,
  navigational: 0,
  local: 0,
  unknown: 0,
};

function toSummaryRow(m: QueryPageMapping): KeywordSummaryRow {
  return { query: m.query, page: m.primaryPage, clicks: m.totalClicks, impressions: m.totalImpressions, ctr: m.averageCtr, position: m.averagePosition, searchIntent: m.searchIntent };
}

function toSummaryItem(issue: SeoIssue): KeywordOpportunitySummaryItem {
  return { query: issue.query, page: issue.page ?? null, issueType: issue.type, severity: issue.severity, message: issue.message, opportunityScore: issue.opportunityScore?.score ?? null };
}

function issuesOfType(issues: SeoIssue[], types: SeoIssueType[]): KeywordOpportunitySummaryItem[] {
  return issues.filter((i) => types.includes(i.type)).map(toSummaryItem);
}

function buildSummary(mappings: QueryPageMapping[], issues: SeoIssue[]): KeywordIntelligenceSummary {
  const byClicks = [...mappings].sort((a, b) => b.totalClicks - a.totalClicks);
  const byImpressions = [...mappings].sort((a, b) => b.totalImpressions - a.totalImpressions);
  const distinctPages = new Set(mappings.map((m) => m.primaryPage));

  const intentBreakdown = { ...EMPTY_INTENT_BREAKDOWN };
  for (const m of mappings) intentBreakdown[m.searchIntent] += 1;

  const scores = issues.map((i) => i.opportunityScore?.score).filter((s): s is number => typeof s === "number");
  const averageOpportunityScore = scores.length > 0 ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10 : null;

  return {
    analyzedAt: new Date().toISOString(),
    queriesAnalyzed: mappings.length,
    pagesAnalyzed: distinctPages.size,
    topQueries: byClicks.slice(0, 10).map(toSummaryRow),
    highestImpressionQueries: byImpressions.slice(0, 10).map(toSummaryRow),
    lowCtrOpportunities: issuesOfType(issues, ["gsc-high-impressions-low-ctr"]),
    rankingOpportunities: issuesOfType(issues, ["keyword-ranking-improvement", "keyword-page-optimization", "keyword-successful-topic", "keyword-relevance-investigate"]),
    cannibalizationSignals: issuesOfType(issues, ["keyword-cannibalization"]),
    serviceOpportunities: issuesOfType(issues, ["keyword-service-match"]),
    locationOpportunities: issuesOfType(issues, ["keyword-location-opportunity"]),
    averageOpportunityScore,
    intentBreakdown,
  };
}

export async function runKeywordAnalysis(): Promise<KeywordAnalysisResult> {
  const tokens = await getDecryptedTokens();
  if (!tokens) {
    throw new GscError("not-connected", "Search Console is not connected.");
  }

  const range = getDefaultRange();
  const [rows, pages] = await Promise.all([fetchQueryPageBreakdown(tokens.propertyUrl, range), readPages()]);

  const mappings = buildQueryPageMappings(rows, pages);
  const issues = detectAllKeywordOpportunities(mappings, rows);
  const summary = buildSummary(mappings, issues);

  // Sequential, not Promise.all — see runAudit.ts/runGscAnalysis.ts's
  // comment: these each do their own read-modify-write of the same
  // shared JSON file. generateActionQueue's second argument forces every
  // item's status to "review-required" (Task 9 — no exceptions, even for
  // items that would otherwise classify as automation-tier "safe").
  const now = new Date().toISOString();
  await reconcileIssues(issues.map((issue) => toIssueRecord(issue, now)), "keyword-intelligence");
  await reconcileActions(generateActionQueue(issues, "review-required"), "keyword-intelligence");
  await saveLatestKeywordSummary(summary);

  return { mappings, issues, summary };
}
