import { fetchPeriodComparison } from "./performance";
import { detectAllGscOpportunities } from "./opportunities";
import { getDecryptedTokens } from "./tokenStore";
import { saveLatestPerformance } from "./performanceStore";
import { analyzeGscOpportunities } from "./opportunityAnalysis";
import { saveLatestOpportunityAnalysis } from "./opportunityStore";
import { GscError } from "./errors";
import { reconcileIssues, reconcileActions } from "../store";
import { toIssueRecord, generateActionQueue } from "../actionQueue";
import { readLatestAuditRun } from "../history";
import { detectTechnicalGscCrossCheck } from "../technical/crossCheck";
import type { GscPeriodComparison, SeoIssue } from "../types";

// STEP 3 Task 5 — connects Search Console performance data to the exact
// same STEP 2 issue/action-queue machinery the website audit uses, so a
// future dashboard/API doesn't need to know or care which subsystem
// produced a given recommendation. Scoped with source: "search-console"
// so this run's reconciliation never touches website-audit issues.
//
// STEP 5 Task 5 — also cross-references the latest CACHED technical audit
// (history.ts's readLatestAuditRun — never a fresh crawl) against this
// GSC data. Cross-check issues get their own forced "review-required"
// status (Task 6), same override pattern as STEP 4's keyword-intelligence
// items; the original STEP 3 GSC opportunity types keep their existing
// automationPolicy-tier-based default so this doesn't relabel behavior
// that already shipped in STEP 3.

export interface GscAnalysisResult {
  comparison: GscPeriodComparison;
  issues: SeoIssue[];
  technicalCrossCheckIssues: SeoIssue[];
}

export async function runGscAnalysis(): Promise<GscAnalysisResult> {
  const tokens = await getDecryptedTokens();
  if (!tokens) {
    throw new GscError("not-connected", "Search Console is not connected.");
  }

  const comparison = await fetchPeriodComparison(tokens.propertyUrl);
  const issues = detectAllGscOpportunities(comparison);

  const latestAuditReport = await readLatestAuditRun();
  const technicalCrossCheckIssues = detectTechnicalGscCrossCheck(latestAuditReport, comparison, issues);

  const allIssues = [...issues, ...technicalCrossCheckIssues];

  // Sequential, not Promise.all — see runAudit.ts's comment: these each
  // do their own read-modify-write of the same shared JSON file.
  const now = new Date().toISOString();
  await reconcileIssues(allIssues.map((issue) => toIssueRecord(issue, now)), "search-console");
  await reconcileActions([...generateActionQueue(issues), ...generateActionQueue(technicalCrossCheckIssues, "review-required")], "search-console");
  await saveLatestPerformance(comparison);

  // STEP 12 — additive only: a separate, structured opportunity analysis
  // over the same comparison data, persisted to its own Redis key. Does
  // not change this function's return shape, so the existing
  // /api/seo-agent/gsc/performance route (and everything reading its
  // response) is completely unaffected by this addition.
  const opportunityAnalysis = analyzeGscOpportunities(comparison, tokens.propertyUrl);
  await saveLatestOpportunityAnalysis(opportunityAnalysis);

  return { comparison, issues: allIssues, technicalCrossCheckIssues };
}
