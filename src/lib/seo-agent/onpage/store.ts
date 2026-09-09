import { promises as fs } from "fs";
import path from "path";
import type { IssueChangeEntry, OnPageHistoryEntry, OnPageSeoSummary, SeoActionQueueItem, SeoAuditReport, SeoIssueType, TechnicalChangeSummary } from "../types";

// STEP 6 Task 12/13 — persists the most recent on-page scan summary so
// the dashboard reads it without re-crawling. Same pattern as
// technical/store.ts, gsc/performanceStore.ts, and keywords/store.ts.

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "onpage-seo-latest.json");
const HISTORY_WINDOW = 10;

const ONPAGE_ISSUE_TYPES = new Set<SeoIssueType>([
  "title-recommendation",
  "meta-description-recommendation",
  "heading-recommendation",
  "content-intent-recommendation",
  "internal-link-recommendation",
  "alt-text-recommendation",
]);

export async function saveLatestOnPageSummary(summary: OnPageSeoSummary): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(summary, null, 2));
}

const EMPTY_SUMMARY: OnPageSeoSummary = {
  lastScanAt: null,
  pagesAnalyzed: 0,
  onPageScore: null,
  pagesNeedingOptimization: 0,
  titleIssues: 0,
  metaDescriptionIssues: 0,
  headingIssues: 0,
  contentIntentIssues: 0,
  internalLinkOpportunities: 0,
  altTextIssues: 0,
  highPriorityCount: 0,
  mediumPriorityCount: 0,
  lowPriorityCount: 0,
  pendingApprovals: 0,
  completedActions: 0,
  history: [],
};

export async function getLatestOnPageSummary(): Promise<OnPageSeoSummary> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return { ...EMPTY_SUMMARY, ...JSON.parse(raw) };
  } catch {
    return EMPTY_SUMMARY;
  }
}

function priorityFromSeverity(severity: "critical" | "warning" | "opportunity"): "high" | "medium" | "low" {
  if (severity === "critical") return "high";
  if (severity === "warning") return "medium";
  return "low";
}

function countByType(issues: { type: SeoIssueType }[], type: SeoIssueType): number {
  return issues.filter((i) => i.type === type).length;
}

/** STEP 6 Task 8/12/13 — builds the persisted OnPageSeoSummary from this
 * run's SeoAuditReport, the on-page-specific slice of STEP 5's ALREADY-
 * COMPUTED TechnicalChangeSummary (no second diffing pass — see Task 13's
 * doc comment on OnPageHistoryEntry), the current action-queue snapshot
 * (for pending/completed counts), and the trailing history window. */
export function buildOnPageSeoSummary(report: SeoAuditReport, changes: TechnicalChangeSummary, actions: SeoActionQueueItem[], recentReports: SeoAuditReport[]): OnPageSeoSummary {
  const allIssues = [...report.criticalIssues, ...report.warnings, ...report.opportunities];
  const onPageIssues = allIssues.filter((i) => ONPAGE_ISSUE_TYPES.has(i.type));

  const pagesNeedingOptimization = new Set(onPageIssues.map((i) => i.page).filter((p): p is string => Boolean(p))).size;

  const priorities = onPageIssues.map((i) => priorityFromSeverity(i.severity));
  const highPriorityCount = priorities.filter((p) => p === "high").length;
  const mediumPriorityCount = priorities.filter((p) => p === "medium").length;
  const lowPriorityCount = priorities.filter((p) => p === "low").length;

  const onPageActions = actions.filter((a) => ONPAGE_ISSUE_TYPES.has(a.issueType));
  const pendingApprovals = onPageActions.filter((a) => a.status === "pending" || a.status === "review-required").length;
  const completedActions = onPageActions.filter((a) => a.status === "done").length;

  const isOnPageEntry = (entry: IssueChangeEntry) => ONPAGE_ISSUE_TYPES.has(entry.type);
  const newCount = changes.newIssues.filter(isOnPageEntry).length;
  const resolvedCount = changes.resolvedIssues.filter(isOnPageEntry).length;
  const improvedPagesCount = new Set(changes.improvingIssues.filter(isOnPageEntry).map((e) => e.page)).size;
  const worsenedPagesCount = new Set(changes.worseningIssues.filter(isOnPageEntry).map((e) => e.page)).size;

  const history: OnPageHistoryEntry[] = recentReports.slice(-HISTORY_WINDOW).map((r) => {
    const rIssues = [...r.criticalIssues, ...r.warnings, ...r.opportunities].filter((i) => ONPAGE_ISSUE_TYPES.has(i.type));
    const rPriorities = rIssues.map((i) => priorityFromSeverity(i.severity));
    return {
      generatedAt: r.generatedAt,
      pagesAnalyzed: r.pagesAudited,
      onPageScore: r.onPageScore?.score ?? 0,
      recommendationsCount: rIssues.length,
      highCount: rPriorities.filter((p) => p === "high").length,
      mediumCount: rPriorities.filter((p) => p === "medium").length,
      lowCount: rPriorities.filter((p) => p === "low").length,
      newCount: 0, // per-historical-entry new/resolved counts aren't retained; the current run's are exposed via `changes` above
      resolvedCount: 0,
      improvedPagesCount: 0,
      worsenedPagesCount: 0,
    };
  });
  // The MOST RECENT history entry (this run) does carry real new/resolved/improved/worsened counts.
  if (history.length > 0) {
    const last = history[history.length - 1];
    history[history.length - 1] = { ...last, newCount, resolvedCount, improvedPagesCount, worsenedPagesCount };
  }

  return {
    lastScanAt: report.generatedAt,
    pagesAnalyzed: report.pagesAudited,
    onPageScore: report.onPageScore,
    pagesNeedingOptimization,
    titleIssues: countByType(onPageIssues, "title-recommendation"),
    metaDescriptionIssues: countByType(onPageIssues, "meta-description-recommendation"),
    headingIssues: countByType(onPageIssues, "heading-recommendation"),
    contentIntentIssues: countByType(onPageIssues, "content-intent-recommendation"),
    internalLinkOpportunities: countByType(onPageIssues, "internal-link-recommendation"),
    altTextIssues: countByType(onPageIssues, "alt-text-recommendation"),
    highPriorityCount,
    mediumPriorityCount,
    lowPriorityCount,
    pendingApprovals,
    completedActions,
    history,
  };
}
