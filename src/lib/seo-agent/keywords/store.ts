import { promises as fs } from "fs";
import path from "path";
import type { KeywordIntelligenceSummary } from "../types";

// Persists the most recent keyword-intelligence summary so the main
// dashboard (Task 10) can display it without re-running the whole
// analysis (which itself requires a live Search Console fetch) on every
// dashboard view. Same pattern as gsc/performanceStore.ts.

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "keyword-intelligence-latest.json");

export async function saveLatestKeywordSummary(summary: KeywordIntelligenceSummary): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(summary, null, 2));
}

const EMPTY_SUMMARY: KeywordIntelligenceSummary = {
  analyzedAt: null,
  queriesAnalyzed: 0,
  pagesAnalyzed: 0,
  topQueries: [],
  highestImpressionQueries: [],
  lowCtrOpportunities: [],
  rankingOpportunities: [],
  cannibalizationSignals: [],
  serviceOpportunities: [],
  locationOpportunities: [],
  averageOpportunityScore: null,
  intentBreakdown: { informational: 0, commercial: 0, transactional: 0, navigational: 0, local: 0, unknown: 0 },
};

export async function getLatestKeywordSummary(): Promise<KeywordIntelligenceSummary> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return { ...EMPTY_SUMMARY, ...JSON.parse(raw) };
  } catch {
    return EMPTY_SUMMARY;
  }
}
