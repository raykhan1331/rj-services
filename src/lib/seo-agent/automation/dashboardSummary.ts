import type { ChangeHistoryEntry, ChangeManagementSummary, SeoActionQueueItem } from "../types";

// STEP 9 Task 12 — a flat summary for the dashboard, built from the
// already-loaded action queue + change history (no new reads beyond
// what dashboard.ts already fetches for other sections).

const RECENT_CHANGES_LIMIT = 10;

export function buildChangeManagementSummary(actions: SeoActionQueueItem[], history: ChangeHistoryEntry[]): ChangeManagementSummary {
  return {
    pendingApprovals: actions.filter((a) => a.status === "pending" || a.status === "review-required").length,
    approvedActions: actions.filter((a) => a.status === "approved").length,
    executingActions: actions.filter((a) => a.status === "executing" || a.status === "validating").length,
    completedActions: actions.filter((a) => a.status === "done" || a.status === "rollback-available").length,
    failedActions: actions.filter((a) => a.status === "failed").length,
    rollbackAvailable: actions.filter((a) => a.status === "rollback-available").length,
    rejectedActions: actions.filter((a) => a.status === "rejected" || a.status === "skipped").length,
    highRiskActions: actions.filter((a) => a.riskLevel === "high" && (a.status === "pending" || a.status === "review-required" || a.status === "approved")).length,
    recentChanges: [...history].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, RECENT_CHANGES_LIMIT),
  };
}
