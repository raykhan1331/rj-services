import { promises as fs } from "fs";
import path from "path";
import type { SeoAuditReport } from "./types";

// File-based audit history — server-only, same pattern as src/lib/leads/
// store.ts. Lives under /data, which is git-ignored. Note the same
// limitation as the leads store: on a serverless deployment (e.g. Vercel)
// the filesystem isn't guaranteed to persist across invocations, so this
// is a local-dev-friendly foundation — a future step should move history
// to a real database before relying on it in production.

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "seo-audit-history.json");
const MAX_HISTORY_ENTRIES = 50;

interface StoredHistory {
  runs: SeoAuditReport[];
}

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ runs: [] } satisfies StoredHistory, null, 2));
  }
}

async function readHistory(): Promise<StoredHistory> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return { runs: [] };
  }
}

export async function appendAuditRun(report: SeoAuditReport): Promise<void> {
  const history = await readHistory();
  history.runs.push(report);
  if (history.runs.length > MAX_HISTORY_ENTRIES) {
    history.runs = history.runs.slice(-MAX_HISTORY_ENTRIES);
  }
  await fs.writeFile(DATA_FILE, JSON.stringify(history, null, 2));
}

export async function readAuditHistory(): Promise<SeoAuditReport[]> {
  const history = await readHistory();
  return history.runs;
}

export async function readLatestAuditRun(): Promise<SeoAuditReport | null> {
  const runs = await readAuditHistory();
  return runs.length > 0 ? runs[runs.length - 1] : null;
}
