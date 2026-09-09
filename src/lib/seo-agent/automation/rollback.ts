import { readActions, updateActionStatus } from "../store";
import { SEO_CONFIG } from "../config";
import { getLatestSuccessfulSnapshot, appendChangeHistory, readChangeHistory, updateChangeHistoryEntry } from "./store";
import { applyFieldChange } from "./fieldExecutors";
import { validateFieldChange } from "./validation";
import type { ChangeSnapshot } from "./types";

// STEP 9 Task 8 — rollback is a TWO-STEP process, never silent: preview
// (Task 8 steps 1-2, read-only) shows exactly what would be restored;
// confirmRollback (steps 3-6) only runs when the caller explicitly
// confirms. Reuses fieldExecutors.applyFieldChange for the restore
// itself, so a rollback gets the SAME exact-match safety check a forward
// execution gets — if the live value has since been changed again (by a
// later execution or a manual edit), rollback refuses rather than
// clobbering something newer.

export interface RollbackPreview {
  available: boolean;
  actionId: string;
  page?: string;
  field?: string;
  currentValue?: string;
  valueToRestore?: string;
  reason?: string;
}

export async function previewRollback(actionId: string): Promise<RollbackPreview> {
  const snapshot = await getLatestSuccessfulSnapshot(actionId);
  if (!snapshot) {
    return { available: false, actionId, reason: "No successful execution snapshot exists for this action — ROLLBACK NOT AVAILABLE." };
  }
  return {
    available: true,
    actionId,
    page: snapshot.page,
    field: snapshot.field,
    currentValue: snapshot.newValue,
    valueToRestore: snapshot.previousValue,
  };
}

export interface RollbackResult {
  success: boolean;
  message: string;
}

export async function confirmRollback(actionId: string, baseUrl: string = SEO_CONFIG.siteUrl): Promise<RollbackResult> {
  const snapshot: ChangeSnapshot | null = await getLatestSuccessfulSnapshot(actionId);
  if (!snapshot) {
    return { success: false, message: "ROLLBACK NOT AVAILABLE — no successful execution snapshot exists for this action." };
  }

  const actions = await readActions();
  const action = actions.find((a) => a.id === actionId);
  if (!action) {
    return { success: false, message: `No action found with id "${actionId}".` };
  }
  if (action.status !== "rollback-available" && action.status !== "done") {
    return { success: false, message: `Action status is "${action.status}" — rollback only applies to a completed, unmodified-since execution.` };
  }

  // The restore is itself a guarded applyFieldChange call: "current"
  // expected is the value the execution SET (snapshot.newValue) — if the
  // live file no longer matches that (e.g. executed again, or edited by
  // hand since), this safely refuses instead of overwriting something
  // newer.
  const restoreResult = await applyFieldChange(snapshot.page, snapshot.field, snapshot.newValue, snapshot.previousValue);

  if (!restoreResult.success) {
    await appendChangeHistory({
      id: `${actionId}:rollback:${new Date().toISOString()}`,
      actionId,
      page: snapshot.page,
      changeType: action.issueType,
      riskLevel: action.riskLevel,
      previousValue: snapshot.newValue,
      newValue: snapshot.previousValue,
      approvalStatus: action.status,
      executionStatus: "failed",
      timestamp: new Date().toISOString(),
      validation: null,
      rollbackStatus: "rollback-failed",
      errorMessage: restoreResult.error ?? "Rollback write failed.",
    });
    return { success: false, message: restoreResult.error ?? "Rollback failed — the live value may have changed since the original execution." };
  }

  const validation = await validateFieldChange(snapshot.page, snapshot.field, snapshot.previousValue, baseUrl);

  await appendChangeHistory({
    id: `${actionId}:rollback:${new Date().toISOString()}`,
    actionId,
    page: snapshot.page,
    changeType: action.issueType,
    riskLevel: action.riskLevel,
    previousValue: snapshot.newValue,
    newValue: snapshot.previousValue,
    approvalStatus: action.status,
    executionStatus: validation.passed ? "completed" : "failed",
    timestamp: new Date().toISOString(),
    validation,
    rollbackStatus: validation.passed ? "rolled-back" : "rollback-failed",
    errorMessage: validation.passed ? null : "Rollback write succeeded but post-rollback validation failed.",
  });

  // Also mark the ORIGINAL execution's history entry as rolled-back, so
  // Task 11's "rollback status" is visible on the record it actually
  // describes, not only on this new rollback-specific entry.
  const history = await readChangeHistory();
  const original = [...history].reverse().find((e) => e.actionId === actionId && e.executionStatus === "completed" && e.rollbackStatus === "rollback-available");
  if (original) {
    await updateChangeHistoryEntry(original.id, { rollbackStatus: validation.passed ? "rolled-back" : "rollback-failed" });
  }

  if (!validation.passed) {
    return { success: false, message: "Rollback write succeeded but post-rollback validation failed — please review manually.", };
  }

  await updateActionStatus(actionId, "review-required");
  return { success: true, message: `Successfully restored ${snapshot.field} on ${snapshot.page} to its previous value.` };
}
