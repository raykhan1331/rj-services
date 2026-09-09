import { readActions, updateActionStatus } from "../store";
import { SEO_CONFIG } from "../config";
import { isAutoExecutable } from "./riskClassification";
import { findConflictsForAction } from "./conflictDetection";
import { applyFieldChange, type ExecutableField } from "./fieldExecutors";
import { validateFieldChange } from "./validation";
import { appendSnapshot } from "./store";
import { appendChangeHistory } from "./store";
import type { ChangeHistoryEntry, SeoActionQueueItem } from "../types";
import type { ChangeSnapshot } from "./types";

// STEP 9 Task 1/5/6/7/15 — the safe-execution orchestrator. Every branch
// either applies the ONE approved change and validates it, or refuses
// with a clear, recorded reason — there is no path that silently does
// nothing while claiming success, and no path that retries automatically
// (Task 15: "prevent automatic repeated execution").
//
// Gated behind SEO_AGENT_ALLOW_EXECUTION=true (unset by default): having
// this code deployed does not by itself mean anything can be written to
// the live site's source — a deliberate operator opt-in is required in
// addition to a human having already approved the specific action. This
// mirrors the project's established pattern of every risky capability
// (Gemini, Search Console) being opt-in via its own env var, never
// on-by-default.

function isExecutionAllowed(): boolean {
  return process.env.SEO_AGENT_ALLOW_EXECUTION === "true";
}

function fieldForIssueType(issueType: string): ExecutableField | null {
  if (issueType === "title-recommendation") return "title";
  if (issueType === "meta-description-recommendation") return "meta-description";
  return null;
}

async function recordHistory(action: SeoActionQueueItem, executionStatus: ChangeHistoryEntry["executionStatus"], validation: ChangeHistoryEntry["validation"], errorMessage: string | null): Promise<void> {
  await appendChangeHistory({
    id: `${action.id}:${new Date().toISOString()}`,
    actionId: action.id,
    page: action.page,
    changeType: action.issueType,
    riskLevel: action.riskLevel,
    previousValue: action.evidence ?? null,
    newValue: action.recommendedValue ?? null,
    approvalStatus: action.status,
    executionStatus,
    timestamp: new Date().toISOString(),
    validation,
    rollbackStatus: executionStatus === "completed" ? "rollback-available" : "not-applicable",
    errorMessage,
  });
}

export interface ExecutionResult {
  success: boolean;
  status: string;
  message: string;
  validation?: ChangeHistoryEntry["validation"];
}

export async function executeAction(actionId: string, baseUrl: string = SEO_CONFIG.siteUrl): Promise<ExecutionResult> {
  const actions = await readActions();
  const action = actions.find((a) => a.id === actionId);
  if (!action) return { success: false, status: "not-found", message: `No action found with id "${actionId}".` };

  // Task 1 — approval is never skippable.
  if (action.status !== "approved") {
    return { success: false, status: action.status, message: `Action must be "approved" before it can be executed (current status: "${action.status}").` };
  }

  // Task 10 — conflicts pause execution and require review, they never
  // resolve themselves silently.
  const conflicts = findConflictsForAction(actionId, actions);
  if (conflicts.length > 0) {
    await updateActionStatus(actionId, "review-required");
    await recordHistory(action, "failed", null, `Execution paused — conflict detected: ${conflicts.map((c) => c.description).join(" ")}`);
    return { success: false, status: "review-required", message: `Execution paused due to a conflict: ${conflicts[0].description}` };
  }

  // Task 2/13 — only the explicitly-allowlisted, verified-safe change
  // types are auto-executable; everything else is honestly refused
  // rather than guessed at.
  const field = fieldForIssueType(action.issueType);
  if (!isAutoExecutable(action.issueType) || !field) {
    await updateActionStatus(actionId, "failed");
    await recordHistory(action, "failed", null, `Automated execution is not supported for "${action.issueType}" — this recommendation must be applied manually.`);
    return { success: false, status: "failed", message: `Automated execution is not supported for "${action.issueType}" — apply this recommendation manually.` };
  }

  if (!isExecutionAllowed()) {
    return { success: false, status: action.status, message: "Automated execution is disabled (SEO_AGENT_ALLOW_EXECUTION is not set to \"true\"). The action remains approved and can be applied manually, or execution can be enabled explicitly." };
  }

  if (!action.page) {
    await updateActionStatus(actionId, "failed");
    await recordHistory(action, "failed", null, "Action has no target page.");
    return { success: false, status: "failed", message: "Action has no target page." };
  }

  await updateActionStatus(actionId, "executing");

  const writeResult = await applyFieldChange(action.page, field, action.evidence ?? "", action.recommendedValue ?? "");

  if (!writeResult.success) {
    if (writeResult.stale) {
      // Task 5 — a stale current-value goes back to review, not FAILED.
      await updateActionStatus(actionId, "review-required");
      await recordHistory(action, "failed", null, writeResult.error ?? "Stale value detected.");
      return { success: false, status: "review-required", message: writeResult.error ?? "The page changed since this recommendation was created — re-review required." };
    }
    await updateActionStatus(actionId, "failed");
    await recordHistory(action, "failed", null, writeResult.error ?? "Unknown execution error.");
    return { success: false, status: "failed", message: writeResult.error ?? "Execution failed." };
  }

  // Task 6 — snapshot BEFORE moving on to validation, so a rollback
  // target exists even if validation subsequently fails.
  const snapshot: ChangeSnapshot = {
    id: `${actionId}:${new Date().toISOString()}`,
    actionId,
    page: action.page,
    field,
    previousValue: writeResult.previousValue ?? "",
    newValue: action.recommendedValue ?? "",
    filePath: writeResult.filePath ?? "",
    approvedAt: action.updatedAt,
    executedAt: new Date().toISOString(),
    executionResult: "success",
  };
  await appendSnapshot(snapshot);

  await updateActionStatus(actionId, "validating");

  const validation = await validateFieldChange(action.page, field, action.recommendedValue ?? "", baseUrl);

  if (!validation.passed) {
    await updateActionStatus(actionId, "failed");
    await recordHistory(action, "failed", validation, "Post-write validation failed — see validation.checks for details. The change has already been written to the source file; consider rollback.");
    return { success: false, status: "failed", message: "Change was applied but failed validation — see details.", validation };
  }

  await updateActionStatus(actionId, "rollback-available");
  await recordHistory(action, "completed", validation, null);

  return { success: true, status: "rollback-available", message: `Successfully updated ${field} on ${action.page}. Rollback is available.`, validation };
}
