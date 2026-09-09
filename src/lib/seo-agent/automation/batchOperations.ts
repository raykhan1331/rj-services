import { readActions } from "../store";
import { isAutoExecutable } from "./riskClassification";
import { executeAction } from "./execution";
import type { RiskLevel } from "../types";
import type { BatchPreview } from "./types";

// STEP 9 Task 9 — batch operations are preview-then-execute, never a
// single "just run these" call. High-risk actions are unconditionally
// excluded from batch execution ("must not be silently batch-executed")
// regardless of their approval status, and a fixed safety limit caps how
// many actions one batch can touch.

const MAX_BATCH_SIZE = 10;

export async function previewBatch(actionIds: string[]): Promise<BatchPreview> {
  const actions = await readActions();
  const byId = new Map(actions.map((a) => [a.id, a]));
  const eligibleActionIds: string[] = [];
  const blockedActionIds: { id: string; reason: string }[] = [];
  const urls = new Set<string>();
  const actionTypes = new Set<string>();
  const riskLevels = new Set<RiskLevel>();

  for (const id of actionIds) {
    const action = byId.get(id);
    if (!action) {
      blockedActionIds.push({ id, reason: "Action not found." });
      continue;
    }
    if (action.page) urls.add(action.page);
    actionTypes.add(action.issueType);
    riskLevels.add(action.riskLevel);

    if (action.riskLevel === "high") {
      blockedActionIds.push({ id, reason: "High-risk actions cannot be batch-executed — approve and execute individually." });
      continue;
    }
    if (action.status !== "approved") {
      blockedActionIds.push({ id, reason: `Status is "${action.status}", must be "approved" for batch execution.` });
      continue;
    }
    if (!isAutoExecutable(action.issueType)) {
      blockedActionIds.push({ id, reason: `Automated execution is not supported for "${action.issueType}".` });
      continue;
    }
    eligibleActionIds.push(id);
  }

  return {
    requestedCount: actionIds.length,
    eligibleActionIds,
    blockedActionIds,
    urls: Array.from(urls),
    actionTypes: Array.from(actionTypes),
    riskLevels: Array.from(riskLevels),
    withinSafetyLimit: eligibleActionIds.length <= MAX_BATCH_SIZE,
  };
}

export interface BatchExecutionResult {
  preview: BatchPreview;
  results: { actionId: string; success: boolean; message: string }[];
}

export async function executeBatch(actionIds: string[], baseUrl?: string): Promise<BatchExecutionResult> {
  const preview = await previewBatch(actionIds);

  if (!preview.withinSafetyLimit) {
    return {
      preview,
      results: [{ actionId: "*", success: false, message: `Batch of ${preview.eligibleActionIds.length} eligible action(s) exceeds the safety limit of ${MAX_BATCH_SIZE} — reduce the batch size and try again.` }],
    };
  }

  // Sequential, not parallel — each execution reads/writes the shared
  // action-queue and change-history JSON files, same race-condition
  // reasoning as every other multi-write sequence in this codebase
  // (runAudit.ts's comment on this pattern applies here identically).
  const results: BatchExecutionResult["results"] = [];
  for (const id of preview.eligibleActionIds) {
    const result = await executeAction(id, baseUrl);
    results.push({ actionId: id, success: result.success, message: result.message });
  }

  return { preview, results };
}
