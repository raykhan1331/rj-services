import { DEDUCTION } from "../score";
import type { KeywordIntelligenceSummary, OnPageScoreFactor, OnPageSeoScore, SeoIssue, SeoIssueType } from "../types";

// STEP 6 Task 8 — a dedicated, transparent 0-100 On-Page SEO score, same
// factor-based pattern as STEP 5's technicalScore.ts, computed from the
// SAME allIssues the audit already produced (this run's on-page checks
// included) — not a second detection pass. Reuses score.ts's exact
// per-severity DEDUCTION table so all three scores (overall, technical,
// on-page) never disagree about what one issue is "worth".

const ISSUE_FACTORS: { factor: string; types: SeoIssueType[]; explain: string }[] = [
  { factor: "title quality", types: ["missing-title", "title-length", "duplicate-title", "title-recommendation"], explain: "title presence, length, uniqueness, and match to page content" },
  { factor: "meta description quality", types: ["missing-meta-description", "meta-description-length", "duplicate-meta-description", "meta-description-recommendation"], explain: "meta description presence, length, and uniqueness" },
  { factor: "H1 quality", types: ["missing-h1", "multiple-h1", "heading-recommendation"], explain: "H1 presence, uniqueness, and match to the page's real topic" },
  { factor: "heading structure", types: ["no-subheadings", "heading-hierarchy-skip"], explain: "H2/H3 structure supporting the H1" },
  { factor: "content/topic relevance", types: ["thin-content", "content-intent-recommendation"], explain: "content depth and alignment with the page's intended topic/service" },
  { factor: "internal linking", types: ["low-internal-links", "orphan-page", "internal-link-recommendation"], explain: "internal links to and from this page" },
  { factor: "image alt coverage", types: ["missing-alt-text", "alt-text-recommendation"], explain: "descriptive alt text on images" },
  { factor: "schema", types: ["no-structured-data"], explain: "JSON-LD structured data presence" },
];

const WEIGHT_PER_ISSUE_FACTOR = 10; // 8 issue-based factors × 10 = 80
const SEARCH_INTENT_WEIGHT = 10;
const GSC_EVIDENCE_WEIGHT = 10; // + 20 = 100

export function computeOnPageSeoScore(allIssues: SeoIssue[], keywordSummary: KeywordIntelligenceSummary): OnPageSeoScore {
  const factors: OnPageScoreFactor[] = ISSUE_FACTORS.map(({ factor, types, explain }) => {
    const matching = allIssues.filter((i) => types.includes(i.type));
    const deduction = matching.reduce((sum, i) => sum + DEDUCTION[i.severity], 0) / 10;
    const contribution = Math.max(0, Math.round(WEIGHT_PER_ISSUE_FACTOR - deduction));
    const explanation = matching.length === 0 ? `No issues detected for ${explain}.` : `${matching.length} issue(s) detected for ${explain}.`;
    return { factor, weight: WEIGHT_PER_ISSUE_FACTOR, contribution, explanation };
  });

  // Search-intent alignment: how many pages currently have an open,
  // real-query-linked content/intent recommendation (STEP 4 evidence
  // translated onto this page by contentIntentRecommendation.ts).
  const contentIntentIssues = allIssues.filter((i) => i.type === "content-intent-recommendation");
  const intentDeduction = contentIntentIssues.reduce((sum, i) => sum + DEDUCTION[i.severity], 0) / 10;
  factors.push({
    factor: "search-intent alignment",
    weight: SEARCH_INTENT_WEIGHT,
    contribution: Math.max(0, Math.round(SEARCH_INTENT_WEIGHT - intentDeduction)),
    explanation: contentIntentIssues.length === 0 ? "No keyword-intelligence-linked intent-alignment issues detected." : `${contentIntentIssues.length} page(s) have a search-intent alignment issue linked to real query data.`,
  });

  // GSC evidence: not a deduction for a detected PROBLEM — a fixed,
  // honestly-explained factor reflecting whether real Search Console data
  // is actually available to back the recommendations above.
  const gscConnected = keywordSummary.queriesAnalyzed > 0;
  factors.push({
    factor: "GSC evidence",
    weight: GSC_EVIDENCE_WEIGHT,
    contribution: gscConnected ? GSC_EVIDENCE_WEIGHT : 6,
    explanation: gscConnected
      ? `Search Console data is connected (${keywordSummary.queriesAnalyzed} queries analyzed) — recommendations above can draw on real search evidence.`
      : "Search Console is not connected — recommendations above are based on on-page/crawl evidence only, not real query data.",
  });

  const score = factors.reduce((sum, f) => sum + f.contribution, 0);
  return { score: Math.max(0, Math.min(100, score)), factors };
}
