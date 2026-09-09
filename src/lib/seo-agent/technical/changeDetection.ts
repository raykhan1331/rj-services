import { buildIssueId } from "../actionQueue";
import type { IssueChangeEntry, IssueChangeStatus, SeoAuditReport, SeoIssue, TechnicalChangeSummary } from "../types";

// STEP 5 Task 4 — compares the current scan's issues against the
// previous run (read from history.ts's already-persisted audit history —
// no duplicate storage). Matches issues by the same stable identity
// actionQueue.ts already uses (buildIssueId: type+page[+query]) so "the
// same issue across runs" means exactly what it means everywhere else in
// this codebase.
//
// Honesty note on worsening/improving: an issue's SEVERITY is fixed per
// TYPE (e.g. "missing-title" is always "critical") — it never changes
// between runs for the same issue. What CAN change is the underlying
// count/magnitude a persisting issue's evidence describes (e.g. "3 of 5
// images missing alt" → "4 of 5"). This is a best-effort extraction of
// the first number found in the issue's evidence/message — when no
// number can be extracted, the issue is honestly reported as "unchanged"
// rather than guessing a direction.

function extractMagnitude(issue: SeoIssue): number | null {
  const source = issue.evidence ?? issue.message ?? "";
  const match = source.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function toEntry(issue: SeoIssue, status: IssueChangeStatus, previousMagnitude: number | null, currentMagnitude: number | null): IssueChangeEntry {
  return { id: buildIssueId(issue), type: issue.type, page: issue.page ?? null, severity: issue.severity, status, message: issue.message, previousMagnitude, currentMagnitude };
}

/** A previous SeoAuditReport's full flat issue list — criticalIssues +
 * warnings + opportunities together are exactly allIssues (every issue
 * belongs to exactly one of the three severity buckets), so this is
 * always complete and never needs a fourth, separately-stored list. */
function flattenReportIssues(report: SeoAuditReport): SeoIssue[] {
  return [...report.criticalIssues, ...report.warnings, ...report.opportunities];
}

export function detectTechnicalChanges(currentIssues: SeoIssue[], previousReport: SeoAuditReport | null, currentTechnicalScore: number): TechnicalChangeSummary {
  if (!previousReport) {
    return {
      comparedAgainst: null,
      newIssues: [],
      resolvedIssues: [],
      worseningIssues: [],
      improvingIssues: [],
      unchangedCount: 0,
      scoreTrend: "unknown",
      previousTechnicalScore: null,
      currentTechnicalScore,
    };
  }

  const previousIssues = flattenReportIssues(previousReport);
  const previousById = new Map(previousIssues.map((i) => [buildIssueId(i), i]));
  const currentById = new Map(currentIssues.map((i) => [buildIssueId(i), i]));

  const newIssues: IssueChangeEntry[] = [];
  const worseningIssues: IssueChangeEntry[] = [];
  const improvingIssues: IssueChangeEntry[] = [];
  let unchangedCount = 0;

  for (const [id, issue] of currentById) {
    const previous = previousById.get(id);
    if (!previous) {
      newIssues.push(toEntry(issue, "new", null, extractMagnitude(issue)));
      continue;
    }
    const prevMag = extractMagnitude(previous);
    const curMag = extractMagnitude(issue);
    if (prevMag !== null && curMag !== null && curMag !== prevMag) {
      const status: IssueChangeStatus = curMag > prevMag ? "worsening" : "improving";
      const entry = toEntry(issue, status, prevMag, curMag);
      (status === "worsening" ? worseningIssues : improvingIssues).push(entry);
    } else {
      unchangedCount += 1;
    }
  }

  const resolvedIssues: IssueChangeEntry[] = [];
  for (const [id, issue] of previousById) {
    if (!currentById.has(id)) {
      resolvedIssues.push(toEntry(issue, "resolved", extractMagnitude(issue), null));
    }
  }

  // previousReport.technicalScore may be absent on a report stored before
  // STEP 5 (older history entries predate this field) — optional-chained
  // rather than assumed present, even though the type says it's required.
  const previousTechnicalScore = previousReport.technicalScore?.score ?? null;
  let scoreTrend: TechnicalChangeSummary["scoreTrend"] = "unknown";
  if (previousTechnicalScore !== null) {
    if (currentTechnicalScore > previousTechnicalScore) scoreTrend = "improving";
    else if (currentTechnicalScore < previousTechnicalScore) scoreTrend = "worsening";
    else scoreTrend = "stable";
  }

  return {
    comparedAgainst: previousReport.generatedAt,
    newIssues,
    resolvedIssues,
    worseningIssues,
    improvingIssues,
    unchangedCount,
    scoreTrend,
    previousTechnicalScore,
    currentTechnicalScore,
  };
}
