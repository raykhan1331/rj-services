import { getDashboardData } from "../dashboard";
import { readActions } from "../store";
import type { SeoActionQueueItem, SeoDashboardData } from "../types";

// STEP 8 Task 1/14 — the assistant's ENTIRE data context is built from
// already-cached/persisted reads: getDashboardData() (Steps 2-7's own
// aggregator, which already combines the latest audit report, technical/
// on-page/internal-linking summaries, keyword intelligence, and Search
// Console status) plus the full action-queue list (the dashboard only
// exposes counts). Nothing here triggers a new crawl or a new Google API
// call — those only happen when /api/seo-agent/audit,
// /api/seo-agent/gsc/performance, or /api/seo-agent/keywords/analyze are
// explicitly run.

export interface AssistantContext {
  dashboard: SeoDashboardData;
  actions: SeoActionQueueItem[];
  gscConnected: boolean;
}

export async function buildAssistantContext(): Promise<AssistantContext> {
  const [dashboard, actions] = await Promise.all([getDashboardData(), readActions()]);
  return {
    dashboard,
    actions,
    gscConnected: dashboard.searchConsole.connection.state === "connected",
  };
}
