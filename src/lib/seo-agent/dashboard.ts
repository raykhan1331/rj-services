import { readAuditHistory, readLatestAuditRun } from "./history";
import { readActions, readIssues, readPages } from "./store";
import { getConnectionStatus } from "./gsc/connection";
import { getLatestPerformance } from "./gsc/performanceStore";
import { getLatestKeywordSummary } from "./keywords/store";
import { getLatestTechnicalSummary } from "./technical/store";
import { getLatestOnPageSummary } from "./onpage/store";
import { getLatestLinkingSummary } from "./linking/store";
import { readChangeHistory } from "./automation/store";
import { buildChangeManagementSummary } from "./automation/dashboardSummary";
import { computeCurrentStatus } from "./monitoring/currentAlerts";
import { computeTrends } from "./monitoring/trends";
import { getLatestMonitoringRun, readReportHistory } from "./monitoring/store";
import { identifyImportantPages } from "./monitoring/importantPages";
import type { SeoDashboardData } from "./types";

/** Data shape a future SEO dashboard UI reads. `recentlyFixed` stays empty
 * until a future step adds a diff between consecutive runs; `summary`
 * gives flat counts so a UI doesn't need to re-derive them from the full
 * report. `summary.searchConsole` (STEP 3 Task 6), `keywordIntelligence`
 * (STEP 4 Task 10), `technicalSeo` (STEP 5 Task 8), `onPageSeo`
 * (STEP 6 Task 12), and `internalLinking` (STEP 7 Task 12) read only
 * PERSISTED data — they never make a live Google API call or trigger a
 * new crawl; call /api/seo-agent/audit, /api/seo-agent/gsc/performance,
 * or /api/seo-agent/keywords/analyze to refresh them. */
export async function getDashboardData(): Promise<SeoDashboardData> {
  const [latest, history, actions, issues, gscConnection, gscPerformance, keywordIntelligence, technicalSeo, onPageSeo, internalLinking, changeHistory, currentStatus, latestRun, reportHistory, pages] = await Promise.all([
    readLatestAuditRun(),
    readAuditHistory(),
    readActions(),
    readIssues(),
    getConnectionStatus(),
    getLatestPerformance(),
    getLatestKeywordSummary(),
    getLatestTechnicalSummary(),
    getLatestOnPageSummary(),
    getLatestLinkingSummary(),
    readChangeHistory(),
    computeCurrentStatus(),
    getLatestMonitoringRun(),
    readReportHistory(),
    readPages(),
  ]);
  const pendingActions = actions.filter((a) => a.status === "pending").length;
  const gscOpenIssues = issues.filter((i) => i.source === "search-console" && i.status === "open");
  const sortedReportHistory = [...reportHistory].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  const trends = computeTrends(sortedReportHistory[0] ?? null, sortedReportHistory[1] ?? null, gscPerformance);
  const importantPages = identifyImportantPages(pages, gscPerformance, issues.filter((i) => i.status === "open"), technicalSeo.changes);

  return {
    latest,
    history: history.map((run) => ({ generatedAt: run.generatedAt, overallScore: run.score.overall })),
    recentlyFixed: [],
    summary: {
      overallScore: latest?.score.overall ?? null,
      criticalCount: latest?.criticalIssues.length ?? 0,
      warningCount: latest?.warnings.length ?? 0,
      opportunityCount: latest?.opportunities.length ?? 0,
      pagesScanned: latest?.pagesAudited ?? 0,
      pendingActions,
      lastScanAt: latest?.generatedAt ?? null,
    },
    searchConsole: {
      connection: gscConnection,
      performance: gscPerformance,
      opportunities: {
        critical: gscOpenIssues.filter((i) => i.severity === "critical").length,
        warning: gscOpenIssues.filter((i) => i.severity === "warning").length,
        opportunity: gscOpenIssues.filter((i) => i.severity === "opportunity").length,
      },
    },
    keywordIntelligence,
    technicalSeo,
    onPageSeo,
    internalLinking,
    changeManagement: buildChangeManagementSummary(actions, changeHistory),
    monitoring: {
      healthScore: currentStatus.healthScore,
      trends,
      importantPages,
      alerts: currentStatus.alerts,
      latestRun,
      // Hobby-plan Vercel Cron runs once daily (see vercel.json) — a
      // real "next run" timestamp isn't queryable from this app, so this
      // states the schedule honestly rather than fabricating a precise time.
      nextScheduledRun: "Daily (see vercel.json cron schedule)",
      reportHistory: sortedReportHistory.slice(0, 10),
    },
  };
}
