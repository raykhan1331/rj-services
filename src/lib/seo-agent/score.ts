import type { CategoryScore, IssueSeverity, SeoIssue, SeoScoreBreakdown } from "./types";

// Deterministic point deductions — no randomness, no AI judgement. Every
// point lost traces back to a specific detected issue, so the score is
// always explainable by listing that category's `issues`. Exported so
// STEP 5's technicalScore.ts reuses the exact same per-severity weighting
// instead of defining a second, potentially-inconsistent scale.
export const DEDUCTION: Record<IssueSeverity, number> = {
  critical: 20,
  warning: 8,
  opportunity: 3,
};

// Weighted average of the six category scores, weights summing to 1.
// Technical and on-page carry the most weight since they gate whether the
// other categories even matter (an unindexable page's content quality is
// moot).
const WEIGHTS = {
  technical: 0.25,
  onPage: 0.25,
  content: 0.15,
  internalLinking: 0.15,
  structuredData: 0.1,
  indexability: 0.1,
} as const;

function scoreCategory(issues: SeoIssue[]): CategoryScore {
  const deduction = issues.reduce((sum, issue) => sum + DEDUCTION[issue.severity], 0);
  const score = Math.max(0, Math.min(100, 100 - deduction));
  return { score, maxScore: 100, issues };
}

export function computeScore(allIssues: SeoIssue[]): SeoScoreBreakdown {
  const byCategory = (category: SeoIssue["category"]) => allIssues.filter((i) => i.category === category);

  const technical = scoreCategory(byCategory("technical"));
  const onPage = scoreCategory(byCategory("on-page"));
  const content = scoreCategory(byCategory("content"));
  const internalLinking = scoreCategory(byCategory("internal-linking"));
  const structuredData = scoreCategory(byCategory("structured-data"));
  const indexability = scoreCategory(byCategory("indexability"));

  const overall = Math.round(
    technical.score * WEIGHTS.technical +
      onPage.score * WEIGHTS.onPage +
      content.score * WEIGHTS.content +
      internalLinking.score * WEIGHTS.internalLinking +
      structuredData.score * WEIGHTS.structuredData +
      indexability.score * WEIGHTS.indexability
  );

  return { overall, technical, onPage, content, internalLinking, structuredData, indexability };
}
