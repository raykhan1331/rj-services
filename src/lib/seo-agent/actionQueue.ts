import { classifyIssue } from "./automationPolicy";
import type { ActionPriority, ActionStatus, IssueSeverity, SeoActionQueueItem, SeoIssue, SeoIssueRecord } from "./types";

// STEP 2 Task 5 / STEP 3 Task 5 / STEP 4 Task 9 — turns each detected
// issue (from the website audit, Search Console analysis, or keyword
// intelligence) into a queued, human-reviewable action. Every item is
// created with status "pending" (or "review-required" for
// keyword-intelligence issues — see generateActionQueue below) —
// nothing in this module (or anywhere else in the codebase) ever
// transitions an item to "approved" or "done" automatically.
// `requiresApproval` reflects the automationPolicy classification
// honestly (false only for the "safe" tier) so a future step knows which
// items COULD eventually be auto-applied once that capability exists —
// it does not mean this step applies anything.

/** Stable id shared between an issue's transient form, its persisted
 * SeoIssueRecord, and its action-queue item — this is what lets store.ts
 * track the same issue/action across runs. Includes `query`/`linkTarget`
 * because a single issue type (e.g. high-impressions-low-ctr, or STEP 6's
 * internal-link-recommendation) can fire more than once for the same
 * type+page — omitting the extra key would collide them into one record.
 * STEP 6's alt-text-recommendation additionally disambiguates on
 * `evidence` (the specific image's src) since one page can have several
 * images each needing their own recommendation. */
export function buildIssueId(issue: SeoIssue): string {
  const parts = [issue.type, issue.page ?? "site"];
  if (issue.query) parts.push(issue.query);
  if (issue.linkTarget) parts.push(issue.linkTarget);
  if (issue.type === "alt-text-recommendation" && issue.evidence) parts.push(issue.evidence);
  return parts.join(":");
}

function severityToPriority(severity: IssueSeverity): ActionPriority {
  if (severity === "critical") return "high";
  if (severity === "warning") return "medium";
  return "low";
}

export function toIssueRecord(issue: SeoIssue, now: string): SeoIssueRecord {
  const classification = classifyIssue(issue);
  return {
    id: buildIssueId(issue),
    type: issue.type,
    source: issue.source ?? "audit",
    severity: issue.severity,
    category: issue.category,
    page: issue.page ?? null,
    query: issue.query,
    currentMetric: issue.currentMetric,
    searchIntent: issue.searchIntent,
    opportunityScore: issue.opportunityScore,
    recommendedValue: issue.recommendedValue,
    linkTarget: issue.linkTarget,
    evidenceBasis: issue.evidenceBasis,
    description: issue.message,
    evidence: issue.evidence,
    recommendedSolution: classification.recommendedSolution,
    status: "open",
    detectedAt: now,
    resolvedAt: null,
  };
}

/** `forceStatus` lets STEP 4 Task 9 override the initial status for
 * keyword-intelligence issues to "review-required" — every such
 * recommendation starts there regardless of its automationPolicy tier,
 * with no "safe"-tier exception (Task 9 is explicit about this). Audit
 * and Search Console issues keep the existing "pending" default. */
export function generateActionQueue(issues: SeoIssue[], forceStatus?: ActionStatus): SeoActionQueueItem[] {
  const now = new Date().toISOString();
  return issues.map((issue) => {
    const classification = classifyIssue(issue);
    return {
      id: buildIssueId(issue),
      source: issue.source ?? "audit",
      page: issue.page ?? null,
      query: issue.query,
      currentMetric: issue.currentMetric,
      searchIntent: issue.searchIntent,
      opportunityScore: issue.opportunityScore,
      recommendedValue: issue.recommendedValue,
      linkTarget: issue.linkTarget,
      evidenceBasis: issue.evidenceBasis,
      evidence: issue.evidence,
      issueType: issue.type,
      problem: issue.message,
      recommendedAction: classification.recommendedSolution,
      priority: severityToPriority(issue.severity),
      expectedBenefit: classification.expectedBenefit,
      riskLevel: classification.riskLevel,
      automationTier: classification.tier,
      requiresApproval: forceStatus === "review-required" ? true : classification.tier !== "safe",
      status: forceStatus ?? "pending",
      createdAt: now,
      updatedAt: now,
    };
  });
}
