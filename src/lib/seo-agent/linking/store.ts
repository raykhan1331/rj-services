import { promises as fs } from "fs";
import path from "path";
import type { IssueChangeEntry, LinkGraphSummary, LinkingHistoryEntry, LinkingSeoSummary, SeoActionQueueItem, SeoAuditReport, SeoIssueType, TechnicalChangeSummary } from "../types";

// STEP 7 Task 12/13 — persists the most recent linking/content-
// opportunity summary so the dashboard reads it without re-crawling. Same
// pattern as technical/store.ts and onpage/store.ts.

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "linking-seo-latest.json");
const HISTORY_WINDOW = 10;

const LINKING_ISSUE_TYPES = new Set<SeoIssueType>([
  "internal-link-opportunity",
  "weak-anchor-text",
  "content-existing-page-improvement",
  "content-supporting-content-opportunity",
  "content-new-page-opportunity",
]);
const CONTENT_ISSUE_TYPES = new Set<SeoIssueType>(["content-existing-page-improvement", "content-supporting-content-opportunity", "content-new-page-opportunity"]);

export async function saveLatestLinkingSummary(summary: LinkingSeoSummary): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(summary, null, 2));
}

const EMPTY_SUMMARY: LinkingSeoSummary = {
  lastScanAt: null,
  totalInternalLinks: 0,
  potentialOrphanPages: 0,
  weaklyConnectedPages: 0,
  pagesWithFewIncoming: [],
  pagesWithFewOutgoing: [],
  highValueLinkingOpportunities: 0,
  weakAnchorTextIssues: 0,
  contentOpportunities: 0,
  existingPageImprovements: 0,
  supportingContentOpportunities: 0,
  newPageOpportunities: 0,
  highPriorityCount: 0,
  mediumPriorityCount: 0,
  lowPriorityCount: 0,
  pendingApprovals: 0,
  completedActions: 0,
  history: [],
};

export async function getLatestLinkingSummary(): Promise<LinkingSeoSummary> {
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

/** STEP 7 Task 12/13 — builds the persisted LinkingSeoSummary from this
 * run's live LinkGraphSummary (only available in-memory during THIS run
 * — older history entries honestly show 0 for graph-only metrics, same
 * pattern as technical/summary.ts's pre-STEP-5 technicalScore fallback),
 * this run's SeoAuditReport (for the STEP 7 issue types it now carries),
 * the on-page-only slice of STEP 5's already-computed TechnicalChangeSummary,
 * the current action-queue snapshot, and the trailing history window. */
export function buildLinkingSeoSummary(graph: LinkGraphSummary, report: SeoAuditReport, changes: TechnicalChangeSummary, actions: SeoActionQueueItem[], recentReports: SeoAuditReport[]): LinkingSeoSummary {
  const allIssues = [...report.criticalIssues, ...report.warnings, ...report.opportunities];
  const linkingIssues = allIssues.filter((i) => LINKING_ISSUE_TYPES.has(i.type));
  const contentIssues = linkingIssues.filter((i) => CONTENT_ISSUE_TYPES.has(i.type));

  const priorities = linkingIssues.map((i) => priorityFromSeverity(i.severity));
  const highPriorityCount = priorities.filter((p) => p === "high").length;
  const mediumPriorityCount = priorities.filter((p) => p === "medium").length;
  const lowPriorityCount = priorities.filter((p) => p === "low").length;

  const linkingActions = actions.filter((a) => LINKING_ISSUE_TYPES.has(a.issueType));
  const pendingApprovals = linkingActions.filter((a) => a.status === "pending" || a.status === "review-required").length;
  const completedActions = linkingActions.filter((a) => a.status === "done").length;

  const isLinkingEntry = (entry: IssueChangeEntry) => LINKING_ISSUE_TYPES.has(entry.type);
  const newCount = changes.newIssues.filter(isLinkingEntry).length;
  const resolvedCount = changes.resolvedIssues.filter(isLinkingEntry).length;

  const history: LinkingHistoryEntry[] = recentReports.slice(-HISTORY_WINDOW).map((r) => {
    const rIssues = [...r.criticalIssues, ...r.warnings, ...r.opportunities];
    const rLinking = rIssues.filter((i) => LINKING_ISSUE_TYPES.has(i.type));
    const rContent = rLinking.filter((i) => CONTENT_ISSUE_TYPES.has(i.type));
    const rPriorities = rLinking.map((i) => priorityFromSeverity(i.severity));
    // "orphan-page" is STEP 1's existing binary signal — reused here so
    // every past report (even pre-STEP-7) can honestly report a real
    // potential-orphan count, not just the current run.
    const orphanCount = rIssues.filter((i) => i.type === "orphan-page").length;
    return {
      generatedAt: r.generatedAt,
      internalLinkCount: 0, // graph data only exists in-memory for the CURRENT run — see doc comment above
      potentialOrphanCount: orphanCount,
      linkingOpportunities: countByType(rLinking, "internal-link-opportunity"),
      contentOpportunities: rContent.length,
      highCount: rPriorities.filter((p) => p === "high").length,
      mediumCount: rPriorities.filter((p) => p === "medium").length,
      lowCount: rPriorities.filter((p) => p === "low").length,
      newCount: 0,
      resolvedCount: 0,
    };
  });
  if (history.length > 0) {
    const last = history[history.length - 1];
    history[history.length - 1] = { ...last, internalLinkCount: graph.totalInternalLinks, newCount, resolvedCount };
  }

  return {
    lastScanAt: report.generatedAt,
    totalInternalLinks: graph.totalInternalLinks,
    potentialOrphanPages: graph.potentialOrphanCount,
    weaklyConnectedPages: graph.weaklyConnectedCount,
    pagesWithFewIncoming: graph.pagesWithFewIncoming,
    pagesWithFewOutgoing: graph.pagesWithFewOutgoing,
    highValueLinkingOpportunities: countByType(linkingIssues, "internal-link-opportunity"),
    weakAnchorTextIssues: countByType(linkingIssues, "weak-anchor-text"),
    contentOpportunities: contentIssues.length,
    existingPageImprovements: countByType(contentIssues, "content-existing-page-improvement"),
    supportingContentOpportunities: countByType(contentIssues, "content-supporting-content-opportunity"),
    newPageOpportunities: countByType(contentIssues, "content-new-page-opportunity"),
    highPriorityCount,
    mediumPriorityCount,
    lowPriorityCount,
    pendingApprovals,
    completedActions,
    history,
  };
}
