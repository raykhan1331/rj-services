import { LIVE_ROUTES } from "../config";
import type { SeoActionQueueItem } from "../types";
import type { ConflictReport } from "./types";

// STEP 9 Task 10 — checked before execution (execution.ts calls this and
// refuses to proceed if the target action appears in any report) and
// exposed standalone via the API for the dashboard/assistant to surface.
// Deliberately scoped to conflicts this system can ACTUALLY detect from
// data it has, not a general-purpose diff engine.

const LINK_TYPES = new Set(["internal-link-recommendation", "internal-link-opportunity"]);
const OPEN_STATUSES = new Set(["pending", "review-required", "approved"]);

function normalizePath(p: string): string {
  const stripped = p.split("?")[0].split("#")[0];
  return stripped.length > 1 && stripped.endsWith("/") ? stripped.slice(0, -1) : stripped || "/";
}

/** Task 10's "conflicting title/meta recommendations" and "two actions
 * modifying the same field" — groups open actions by (page, field-ish
 * key) and flags any group with more than one action. For the field
 * types that can only ever have ONE action per page (buildIssueId already
 * guarantees this for title/meta-description), this is a defensive
 * check that should never fire in practice; for internal-link
 * recommendations (which can legitimately come from BOTH STEP 6 and
 * STEP 7's separate detectors targeting the same source→target pair),
 * it's a genuinely useful, real check. */
function detectSameFieldConflicts(actions: SeoActionQueueItem[]): ConflictReport[] {
  const reports: ConflictReport[] = [];
  const groups = new Map<string, SeoActionQueueItem[]>();

  for (const action of actions) {
    if (!OPEN_STATUSES.has(action.status) || !action.page) continue;
    let key: string | null = null;
    if (action.issueType === "title-recommendation" || action.issueType === "meta-description-recommendation" || action.issueType === "heading-recommendation") {
      key = `${action.issueType}:${action.page}`;
    } else if (LINK_TYPES.has(action.issueType) && action.linkTarget) {
      key = `link:${action.page}→${action.linkTarget}`;
    }
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), action]);
  }

  for (const group of groups.values()) {
    if (group.length < 2) continue;
    reports.push({
      conflictType: "same-field-multiple-actions",
      actionIds: group.map((a) => a.id),
      description: `${group.length} open actions target the same field on ${group[0].page} (${group.map((a) => a.issueType).join(", ")}) — review together before approving/executing either.`,
    });
  }

  return reports;
}

/** Task 10's "action targeting a deleted page" — the action's page is no
 * longer among the site's real, currently-configured live routes. */
function detectMissingPageConflicts(actions: SeoActionQueueItem[]): ConflictReport[] {
  const liveP = new Set(LIVE_ROUTES.map((r) => normalizePath(r.path)));
  const reports: ConflictReport[] = [];
  for (const action of actions) {
    if (!OPEN_STATUSES.has(action.status) || !action.page) continue;
    if (!liveP.has(normalizePath(action.page))) {
      reports.push({
        conflictType: "page-not-found",
        actionIds: [action.id],
        description: `${action.page} is no longer among the site's configured live routes — this recommendation may target a removed page.`,
      });
    }
  }
  return reports;
}

export function detectConflicts(actions: SeoActionQueueItem[]): ConflictReport[] {
  return [...detectSameFieldConflicts(actions), ...detectMissingPageConflicts(actions)];
}

/** Used by execution.ts before applying a specific action — Task 10:
 * "If a conflict is detected: PAUSE and require review." */
export function findConflictsForAction(actionId: string, allActions: SeoActionQueueItem[]): ConflictReport[] {
  return detectConflicts(allActions).filter((c) => c.actionIds.includes(actionId));
}
