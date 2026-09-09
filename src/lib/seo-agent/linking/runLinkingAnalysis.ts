import { buildLinkGraph } from "./linkGraph";
import { analyzeAnchorTextQuality } from "./anchorTextQuality";
import { recommendLinkOpportunities } from "./linkOpportunities";
import { detectContentOpportunities } from "./contentOpportunity";
import { readIssues } from "../store";
import { getLatestPerformance } from "../gsc/performanceStore";
import type { CrawledPage } from "../crawler";
import type { KeywordIntelligenceSummary, LinkGraphSummary, SeoIssue } from "../types";

// STEP 7 — the linking & content-opportunity orchestrator, called from
// runAudit.ts right after STEP 6's on-page analysis, reusing the SAME
// in-memory crawl (Task 15) plus already-cached GSC performance and
// keyword-intelligence data (no new Google API call, no new crawl).

export interface LinkingAnalysisResult {
  graph: LinkGraphSummary;
  issues: SeoIssue[];
}

export async function runLinkingAnalysis(crawled: CrawledPage[], keywordSummary: KeywordIntelligenceSummary, onPageIssues: SeoIssue[]): Promise<LinkingAnalysisResult> {
  const graph = buildLinkGraph(crawled);

  const [gscPerformance, allStoredIssues] = await Promise.all([getLatestPerformance(), readIssues()]);
  const keywordIntelligenceRecords = allStoredIssues.filter((i) => i.source === "keyword-intelligence" && i.status === "open");

  const anchorIssues = analyzeAnchorTextQuality(graph, crawled);
  const linkOpportunityIssues = recommendLinkOpportunities(crawled, graph, gscPerformance, keywordSummary, onPageIssues);
  const contentOpportunityIssues = detectContentOpportunities(keywordIntelligenceRecords, keywordSummary, crawled);

  return { graph, issues: [...anchorIssues, ...linkOpportunityIssues, ...contentOpportunityIssues] };
}
