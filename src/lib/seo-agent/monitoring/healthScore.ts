import { DEDUCTION } from "../score";
import type { KeywordIntelligenceSummary, LinkingSeoSummary, SeoAuditReport, SeoHealthScore, SeoHealthScoreFactor, SeoIssueRecord, TechnicalSeoSummary } from "../types";

// STEP 10 Task 4 — combines EXISTING sub-scores/summaries (technical,
// on-page, keyword-intelligence, internal-linking, GSC connection) into
// one transparent 0-100 score. No new detection — every input here was
// already computed by Steps 3-7's own pipelines. Reuses score.ts's exact
// DEDUCTION table so this score never disagrees with the others about
// what one issue is "worth".

const WEIGHTS = {
  technical: 20,
  onPage: 20,
  indexability: 10,
  searchVisibility: 15,
  keywordOpportunities: 10,
  internalLinking: 10,
  contentOpportunities: 10,
  importantPageHealth: 5,
} as const;

function factor(name: string, weight: number, contribution: number, explanation: string): SeoHealthScoreFactor {
  return { factor: name, weight, contribution: Math.max(0, Math.min(weight, Math.round(contribution))), explanation };
}

export function computeSeoHealthScore(
  latest: SeoAuditReport | null,
  technicalSeo: TechnicalSeoSummary,
  keywordIntelligence: KeywordIntelligenceSummary,
  internalLinking: LinkingSeoSummary,
  gscConnected: boolean,
  openGscIssues: SeoIssueRecord[],
  openKeywordIssues: SeoIssueRecord[],
  importantPageOpenIssueCount: number,
  importantPageCount: number
): SeoHealthScore {
  const factors: SeoHealthScoreFactor[] = [];
  const unavailableComponents: string[] = [];

  if (latest) {
    factors.push(factor("Technical SEO", WEIGHTS.technical, (latest.technicalScore.score / 100) * WEIGHTS.technical, `Technical SEO score: ${latest.technicalScore.score}/100.`));
    factors.push(factor("On-Page SEO", WEIGHTS.onPage, (latest.onPageScore.score / 100) * WEIGHTS.onPage, `On-Page SEO score: ${latest.onPageScore.score}/100.`));
  } else {
    unavailableComponents.push("Technical SEO", "On-Page SEO");
  }

  const indexFlags = [technicalSeo.crawlabilityOk, technicalSeo.indexabilityOk, technicalSeo.sitemapOk, technicalSeo.robotsOk];
  const indexTrue = indexFlags.filter(Boolean).length;
  if (technicalSeo.lastScanAt) {
    factors.push(factor("Indexability", WEIGHTS.indexability, (indexTrue / indexFlags.length) * WEIGHTS.indexability, `${indexTrue}/${indexFlags.length} indexability checks (crawlability, indexability, sitemap, robots) passing.`));
  } else {
    unavailableComponents.push("Indexability");
  }

  if (gscConnected) {
    const deduction = openGscIssues.reduce((sum, i) => sum + DEDUCTION[i.severity], 0) / (100 / WEIGHTS.searchVisibility);
    factors.push(factor("Search Visibility", WEIGHTS.searchVisibility, WEIGHTS.searchVisibility - deduction, `${openGscIssues.length} open Search Console-derived issue(s) (declining clicks/impressions, CTR problems).`));
  } else {
    unavailableComponents.push("Search Visibility (Search Console not connected)");
  }

  if (keywordIntelligence.queriesAnalyzed > 0) {
    const deduction = openKeywordIssues.reduce((sum, i) => sum + DEDUCTION[i.severity], 0) / (100 / WEIGHTS.keywordOpportunities);
    factors.push(factor("Keyword Opportunities", WEIGHTS.keywordOpportunities, WEIGHTS.keywordOpportunities - deduction, `${openKeywordIssues.length} open keyword-intelligence opportunity/issue(s) (fewer unaddressed opportunities scores higher).`));
  } else {
    unavailableComponents.push("Keyword Opportunities (no keyword analysis has run yet, requires Search Console)");
  }

  if (internalLinking.pendingApprovals > 0 || internalLinking.lastScanAt) {
    const linkingIssues = internalLinking.potentialOrphanPages + internalLinking.weakAnchorTextIssues + internalLinking.highValueLinkingOpportunities;
    const linkingDeduction = Math.min(WEIGHTS.internalLinking, linkingIssues * 1.5);
    factors.push(factor("Internal Linking", WEIGHTS.internalLinking, WEIGHTS.internalLinking - linkingDeduction, `${internalLinking.potentialOrphanPages} potential orphan page(s), ${internalLinking.weakAnchorTextIssues} weak-anchor issue(s), ${internalLinking.highValueLinkingOpportunities} open link opportunity(ies).`));

    const contentDeduction = Math.min(WEIGHTS.contentOpportunities, internalLinking.contentOpportunities * 1.5);
    factors.push(factor("Content Opportunities", WEIGHTS.contentOpportunities, WEIGHTS.contentOpportunities - contentDeduction, `${internalLinking.contentOpportunities} open content opportunity(ies) (existing-page improvements + supporting-content ideas).`));
  } else {
    unavailableComponents.push("Internal Linking", "Content Opportunities");
  }

  if (importantPageCount > 0) {
    const perPagePenalty = WEIGHTS.importantPageHealth / Math.max(1, importantPageCount);
    factors.push(factor("Important Page Health", WEIGHTS.importantPageHealth, WEIGHTS.importantPageHealth - importantPageOpenIssueCount * perPagePenalty, `${importantPageOpenIssueCount} open issue(s) across ${importantPageCount} identified important page(s).`));
  } else {
    unavailableComponents.push("Important Page Health (no important pages identified yet — requires at least one scan)");
  }

  const score = factors.reduce((sum, f) => sum + f.contribution, 0);
  return { score: Math.max(0, Math.min(100, Math.round(score))), factors, unavailableComponents };
}
