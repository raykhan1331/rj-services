import { promises as fs } from "fs";
import path from "path";
import type { TechnicalSeoSummary } from "../types";

// STEP 5 Task 8/9 — persists the most recent technical-scan summary so
// the dashboard can display it without re-crawling on every view. Same
// pattern as gsc/performanceStore.ts and keywords/store.ts: a small
// persisted snapshot, refreshed only by the endpoint that actually runs
// a scan (/api/seo-agent/audit → runAudit.ts).

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "technical-seo-latest.json");

export async function saveLatestTechnicalSummary(summary: TechnicalSeoSummary): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(summary, null, 2));
}

const EMPTY_SUMMARY: TechnicalSeoSummary = {
  lastScanAt: null,
  pagesScanned: 0,
  technicalScore: null,
  crawlabilityOk: true,
  indexabilityOk: true,
  sitemapOk: true,
  robotsOk: true,
  canonicalHealthy: true,
  brokenLinksCount: 0,
  metadataCoveragePct: null,
  schemaCoveragePct: null,
  critical: 0,
  warnings: 0,
  opportunities: 0,
  changes: null,
  scanHistory: [],
};

export async function getLatestTechnicalSummary(): Promise<TechnicalSeoSummary> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return { ...EMPTY_SUMMARY, ...JSON.parse(raw) };
  } catch {
    return EMPTY_SUMMARY;
  }
}
