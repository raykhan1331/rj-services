import { classifyIssue } from "../automationPolicy";
import type { RiskLevel, SeoIssue, SeoIssueType } from "../types";

// STEP 9 Task 3 — reuses automationPolicy.ts's ISSUE_CATALOG (already
// gives every issue type a `riskLevel`, built in Steps 2-8) rather than
// building a second classification system. This module's job is
// ENFORCEMENT of Task 3's hard rule ("HIGH-RISK actions must always
// require explicit approval. Never bypass the classification."), checked
// against the real catalog at call time, not just documented and hoped.

export function classifyRisk(issueType: SeoIssueType): RiskLevel {
  return classifyIssue({ type: issueType } as SeoIssue).riskLevel;
}

/** Task 3's non-negotiable invariant: nothing classified "high" risk may
 * ever be tier "safe" (which would let it skip approval). Throws — this
 * is a programming-error-level violation the system should never reach
 * in practice, not a runtime condition to handle gracefully, since it
 * would mean automationPolicy.ts itself was misconfigured. */
export function assertHighRiskRequiresApproval(issueType: SeoIssueType): void {
  const classification = classifyIssue({ type: issueType } as SeoIssue);
  if (classification.riskLevel === "high" && classification.tier === "safe") {
    throw new Error(`Risk classification violation: "${issueType}" is riskLevel "high" but tier "safe" — high-risk actions must always require approval.`);
  }
}

/** Task 2/13 — the ONLY change types this step's execution engine can
 * safely apply automatically (see automation/fieldExecutors.ts's doc
 * comment for why the list stops here — every other supported
 * recommendation type remains review-and-apply-manually). Deliberately a
 * small, explicit allowlist rather than "everything not high-risk" —
 * Task 13's "Production modifications should remain approval-controlled
 * unless the existing system has an explicit safe rule for that exact
 * change" is read literally here. */
export const AUTO_EXECUTABLE_TYPES = new Set<SeoIssueType>(["title-recommendation", "meta-description-recommendation"]);

export function isAutoExecutable(issueType: SeoIssueType): boolean {
  return AUTO_EXECUTABLE_TYPES.has(issueType);
}
