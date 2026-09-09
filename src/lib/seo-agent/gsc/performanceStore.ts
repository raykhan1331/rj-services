import { promises as fs } from "fs";
import path from "path";
import type { GscPeriodComparison } from "../types";

// Persists the most recent Search Console performance comparison so the
// main dashboard (Task 6) can display it without making a live Google
// API call on every dashboard view — the dashboard reads this, while
// /api/seo-agent/gsc/performance is what actually triggers a fresh fetch.

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "gsc-performance-latest.json");

export async function saveLatestPerformance(comparison: GscPeriodComparison): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(comparison, null, 2));
}

export async function getLatestPerformance(): Promise<GscPeriodComparison | null> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
