// STEP 9 — types local to the Change Management / Safe Execution layer
// that aren't part of the dashboard-facing surface. ValidationResult,
// RollbackStatus, ChangeHistoryEntry, and ChangeManagementSummary live in
// the main types.ts instead (same place every other step's dashboard-
// facing summary/history types live — TechnicalSeoSummary,
// OnPageSeoSummary, LinkingSeoSummary, ScanHistoryEntry, etc.) so
// SeoDashboardData can reference them without types.ts importing back
// from this file.

/** Task 6 — a lightweight, pre-write record of exactly what a change
 * will do. `executionResult` is filled in AFTER the write attempt
 * (success/failed), so the same record serves as both the "about to
 * change this" snapshot and the permanent history of what happened. */
export interface ChangeSnapshot {
  id: string;
  actionId: string;
  page: string;
  field: "title" | "meta-description";
  previousValue: string;
  newValue: string;
  filePath: string;
  approvedAt: string | null;
  executedAt: string;
  executionResult: "success" | "failed";
  errorMessage?: string;
}

export type ConflictType = "same-field-multiple-actions" | "superseded-by-newer" | "page-not-found" | "page-changed-since-detection";

export interface ConflictReport {
  conflictType: ConflictType;
  actionIds: string[];
  description: string;
}

export interface BatchPreview {
  requestedCount: number;
  eligibleActionIds: string[];
  blockedActionIds: { id: string; reason: string }[];
  urls: string[];
  actionTypes: string[];
  riskLevels: string[];
  withinSafetyLimit: boolean;
}
