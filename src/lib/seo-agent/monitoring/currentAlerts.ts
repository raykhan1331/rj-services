import { readLatestAuditRun } from "../history";
import { getConnectionStatus } from "../gsc/connection";
import { getLatestPerformance } from "../gsc/performanceStore";
import { getLatestTechnicalSummary } from "../technical/store";
import { getLatestLinkingSummary } from "../linking/store";
import { getLatestKeywordSummary } from "../keywords/store";
import { readIssues, readActions, readPages } from "../store";
import { readChangeHistory } from "../automation/store";
import { detectConflicts } from "../automation/conflictDetection";
import { identifyImportantPages } from "./importantPages";
import { computeSeoHealthScore } from "./healthScore";
import { generateAlerts } from "./alerts";
import { getLatestReport, getPreviousReport } from "./store";
import type { SeoAlert, SeoHealthScore } from "../types";

// STEP 10 Task 8 — a READ-ONLY alert (and current health score)
// computation over already-persisted data (no new crawl, no new Google
// API call, no monitoring run triggered) — used by the alerts/dashboard
// endpoints so checking current status doesn't require running the full
// monitoring cycle first. Mirrors runMonitoring.ts's aggregation exactly,
// just without triggering the underlying subsystem runs.

export interface CurrentStatus {
  healthScore: SeoHealthScore;
  alerts: SeoAlert[];
}

export async function computeCurrentStatus(): Promise<CurrentStatus> {
  const [latest, connection, gscPerformance, technicalSeo, internalLinking, keywordIntelligence, allIssues, actions, pages, changeHistory, latestReportEntry, previousReportEntry] = await Promise.all([
    readLatestAuditRun(),
    getConnectionStatus(),
    getLatestPerformance(),
    getLatestTechnicalSummary(),
    getLatestLinkingSummary(),
    getLatestKeywordSummary(),
    readIssues(),
    readActions(),
    readPages(),
    readChangeHistory(),
    getLatestReport(),
    getPreviousReport(),
  ]);

  const gscConnected = connection.state === "connected";
  const openIssues = allIssues.filter((i) => i.status === "open");
  const openGscIssues = openIssues.filter((i) => i.source === "search-console");
  const openKeywordIssues = openIssues.filter((i) => i.source === "keyword-intelligence");

  const importantPages = identifyImportantPages(pages, gscPerformance, openIssues, technicalSeo.changes);
  const importantPageOpenIssueCount = importantPages.reduce((sum, p) => sum + p.openIssueCount, 0);

  const healthScore = computeSeoHealthScore(latest, technicalSeo, keywordIntelligence, internalLinking, gscConnected, openGscIssues, openKeywordIssues, importantPageOpenIssueCount, importantPages.length);

  const conflicts = detectConflicts(actions);
  const recentChangeHistory = [...changeHistory].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 20);

  const alerts = generateAlerts({
    latest,
    // The baseline for "did the score decline" must be the MOST RECENT
    // recorded report (the last completed run) — not the one before that.
    // Since previousReportEntry (getPreviousReport, history[len-2]) is
    // only ever non-null when latestReportEntry also is, an `a ?? b`
    // fallback with these reversed would silently always prefer the
    // second-to-last report once 2+ reports exist, comparing this
    // freshly-computed current score against a stale baseline one run too
    // old and risking a misleading decline alert even when nothing has
    // changed since the actual last run.
    previousHealthScore: latestReportEntry?.healthScore ?? previousReportEntry?.healthScore ?? null,
    healthScore,
    technicalSeo,
    importantPages,
    gscClicksPct: gscPerformance?.change.clicksPct ?? null,
    gscImpressionsPct: gscPerformance?.change.impressionsPct ?? null,
    recentChangeHistory,
    conflicts,
  });

  return { healthScore, alerts };
}
