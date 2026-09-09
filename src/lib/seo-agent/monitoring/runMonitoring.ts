import { SEO_CONFIG } from "../config";
import { runAudit } from "../runAudit";
import { runGscAnalysis } from "../gsc/runGscAnalysis";
import { runKeywordAnalysis } from "../keywords/runKeywordAnalysis";
import { GscError } from "../gsc/errors";
import { getConnectionStatus } from "../gsc/connection";
import { getLatestPerformance } from "../gsc/performanceStore";
import { getLatestTechnicalSummary } from "../technical/store";
import { getLatestLinkingSummary } from "../linking/store";
import { getLatestKeywordSummary } from "../keywords/store";
import { readIssues, readActions, readPages } from "../store";
import { readChangeHistory } from "../automation/store";
import { detectConflicts } from "../automation/conflictDetection";
import { computeSeoHealthScore } from "./healthScore";
import { identifyImportantPages } from "./importantPages";
import { generateAlerts } from "./alerts";
import { acquireMonitoringLock, releaseMonitoringLock, appendMonitoringRun, updateMonitoringRun, appendReportHistory, getLatestReport, getLatestMonitoringRun } from "./store";
import type { MonitoringRun, MonitoringRunStatus, SeoAlert, SeoHealthScore, SeoReportHistoryEntry } from "../types";

// STEP 10 Task 1/2/3/5/11/14/15 — the monitoring orchestrator. Wraps the
// EXISTING subsystem runs (runAudit — which already includes technical,
// on-page, and internal-linking analysis; runGscAnalysis;
// runKeywordAnalysis) rather than re-detecting anything, isolates each in
// its own try/catch so one module's failure doesn't take down the others
// (Task 15), and produces a MonitoringRun record plus a lightweight
// report-history snapshot (Task 10) used for trend comparisons.
//
// Every recommendation this run surfaces already flows into the existing
// Action Queue via runAudit/runGscAnalysis/runKeywordAnalysis themselves
// (all already forced to "review-required" — Task 11 requires nothing
// extra here to keep that guarantee).

function makeRunId(): string {
  return `run-${new Date().toISOString()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface MonitoringResult {
  run: MonitoringRun;
  healthScore: SeoHealthScore;
  alerts: SeoAlert[];
  reportEntry: SeoReportHistoryEntry;
  skipped: boolean;
  skipReason?: string;
}

export async function runMonitoring(baseUrl: string = SEO_CONFIG.siteUrl): Promise<MonitoringResult | { skipped: true; skipReason: string }> {
  // Task 13/14 overlap guard — an atomic lock-file acquire, not a
  // read-then-decide check (see acquireMonitoringLock's own comment for
  // why: a plain status check races under real concurrent requests).
  if (!(await acquireMonitoringLock())) {
    return { skipped: true, skipReason: "A monitoring run is already in progress — refusing to start a duplicate/overlapping run." };
  }
  try {
    return await executeMonitoringRun(baseUrl);
  } finally {
    await releaseMonitoringLock();
  }
}

async function executeMonitoringRun(baseUrl: string): Promise<MonitoringResult> {
  const runId = makeRunId();
  const previousRun = await getLatestMonitoringRun();
  const startedAt = new Date().toISOString();
  const modulesExecuted: string[] = [];
  const modulesFailed: { module: string; error: string }[] = [];

  await appendMonitoringRun({
    id: runId,
    startedAt,
    endedAt: null,
    status: "running",
    modulesExecuted: [],
    modulesFailed: [],
    pagesProcessed: 0,
    issuesDetected: 0,
    recommendationsCreated: 0,
    dataAvailability: { gscConnected: false, keywordIntelligenceAvailable: false },
    previousRunId: previousRun?.id ?? null,
  });

  // Task 1 — technical/on-page/internal-linking (runAudit already
  // includes all three, per Steps 5-7's own wiring).
  let latestReport;
  try {
    latestReport = await runAudit(baseUrl);
    modulesExecuted.push("technical-onpage-linking-audit");
  } catch (err) {
    modulesFailed.push({ module: "technical-onpage-linking-audit", error: err instanceof Error ? err.message : "Unknown error" });
  }

  const connection = await getConnectionStatus();
  const gscConnected = connection.state === "connected";
  let keywordAvailable = false;

  // Task 3 — Search Console, only when connected; never fabricated when not.
  if (gscConnected) {
    try {
      await runGscAnalysis();
      modulesExecuted.push("search-console-analysis");
    } catch (err) {
      if (!(err instanceof GscError && err.code === "not-connected")) {
        modulesFailed.push({ module: "search-console-analysis", error: err instanceof Error ? err.message : "Unknown error" });
      }
    }

    try {
      await runKeywordAnalysis();
      modulesExecuted.push("keyword-intelligence-analysis");
      keywordAvailable = true;
    } catch (err) {
      if (!(err instanceof GscError && err.code === "not-connected")) {
        modulesFailed.push({ module: "keyword-intelligence-analysis", error: err instanceof Error ? err.message : "Unknown error" });
      }
    }
  }

  // --- Aggregate EXISTING, now-freshly-updated data (Task 4/6/7/8) ---
  const [technicalSeo, internalLinking, keywordIntelligence, gscPerformance, allIssues, actions, pages, changeHistory] = await Promise.all([
    getLatestTechnicalSummary(),
    getLatestLinkingSummary(),
    getLatestKeywordSummary(),
    getLatestPerformance(),
    readIssues(),
    readActions(),
    readPages(),
    readChangeHistory(),
  ]);

  const openIssues = allIssues.filter((i) => i.status === "open");
  const openGscIssues = openIssues.filter((i) => i.source === "search-console");
  const openKeywordIssues = openIssues.filter((i) => i.source === "keyword-intelligence");

  const importantPages = identifyImportantPages(pages, gscPerformance, openIssues, technicalSeo.changes);
  const importantPageOpenIssueCount = importantPages.reduce((sum, p) => sum + p.openIssueCount, 0);

  const previousReportEntry = await getLatestReport();

  const healthScore = computeSeoHealthScore(
    latestReport ?? null,
    technicalSeo,
    keywordIntelligence,
    internalLinking,
    gscConnected,
    openGscIssues,
    openKeywordIssues,
    importantPageOpenIssueCount,
    importantPages.length
  );

  const conflicts = detectConflicts(actions);
  const recentChangeHistory = [...changeHistory].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 20);

  const alerts = generateAlerts({
    latest: latestReport ?? null,
    previousHealthScore: previousReportEntry?.healthScore ?? null,
    healthScore,
    technicalSeo,
    importantPages,
    gscClicksPct: gscPerformance?.change.clicksPct ?? null,
    gscImpressionsPct: gscPerformance?.change.impressionsPct ?? null,
    recentChangeHistory,
    conflicts,
  });

  const pendingApprovals = actions.filter((a) => a.status === "pending" || a.status === "review-required").length;
  const completedChanges = actions.filter((a) => a.status === "done" || a.status === "rollback-available").length;
  const failedChanges = actions.filter((a) => a.status === "failed").length;

  const reportEntry: SeoReportHistoryEntry = {
    id: `report-${new Date().toISOString()}`,
    generatedAt: new Date().toISOString(),
    monitoringRunId: runId,
    overallScore: latestReport?.score.overall ?? null,
    healthScore: healthScore.score,
    technicalScore: latestReport?.technicalScore.score ?? null,
    onPageScore: latestReport?.onPageScore.score ?? null,
    criticalCount: latestReport?.criticalIssues.length ?? 0,
    warningCount: latestReport?.warnings.length ?? 0,
    opportunityCount: latestReport?.opportunities.length ?? 0,
    pendingApprovals,
    completedChanges,
    failedChanges,
    majorImprovements: alerts.filter((a) => a.type === "rollback-available").map((a) => a.evidence).slice(0, 5),
    majorDeclines: alerts.filter((a) => a.severity === "critical").map((a) => a.evidence).slice(0, 5),
  };
  await appendReportHistory(reportEntry);

  const status: MonitoringRunStatus = !latestReport ? "failed" : modulesFailed.length > 0 ? "partial" : "completed";
  const endedAt = new Date().toISOString();

  const updatedRun = await updateMonitoringRun(runId, {
    endedAt,
    status,
    modulesExecuted,
    modulesFailed,
    pagesProcessed: latestReport?.pagesAudited ?? 0,
    issuesDetected: openIssues.length,
    recommendationsCreated: actions.filter((a) => a.status === "pending" || a.status === "review-required").length,
    dataAvailability: { gscConnected, keywordIntelligenceAvailable: keywordAvailable },
  });

  return {
    run: updatedRun ?? { id: runId, startedAt, endedAt, status, modulesExecuted, modulesFailed, pagesProcessed: latestReport?.pagesAudited ?? 0, issuesDetected: openIssues.length, recommendationsCreated: 0, dataAvailability: { gscConnected, keywordIntelligenceAvailable: keywordAvailable }, previousRunId: previousRun?.id ?? null },
    healthScore,
    alerts,
    reportEntry,
    skipped: false,
  };
}
