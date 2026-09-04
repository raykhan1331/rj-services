import { promises as fs } from "fs";
import path from "path";
import type { KnowledgeRecord } from "./types";
import { SOURCES } from "./sources";

// File-based knowledge store — server-only. Simple and inspectable at this
// stage of the project; swap for a real database later without changing
// the sync engine or API routes, which only talk to the functions below.

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "knowledge.json");

function emptyRecord(sourceId: string): KnowledgeRecord | null {
  const config = SOURCES.find((s) => s.id === sourceId);
  if (!config) return null;
  return {
    id: config.id,
    provider: config.provider,
    type: config.type,
    sourceUrl: config.url,
    pageTitle: null,
    category: config.category,
    extractedRequirements: [],
    contentHash: null,
    version: 0,
    lastChecked: null,
    lastChanged: null,
    status: "never_checked",
    lastError: null,
    lastChangeSummary: null,
  };
}

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    const initial = SOURCES.map((s) => emptyRecord(s.id)).filter((r): r is KnowledgeRecord => r !== null);
    await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2));
  }
}

export async function readKnowledge(): Promise<KnowledgeRecord[]> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  const stored: KnowledgeRecord[] = JSON.parse(raw);

  // Any source added to the registry since the file was created still
  // needs a placeholder record so it shows up in status immediately.
  const known = new Set(stored.map((r) => r.id));
  const missing = SOURCES.filter((s) => !known.has(s.id))
    .map((s) => emptyRecord(s.id))
    .filter((r): r is KnowledgeRecord => r !== null);

  return [...stored, ...missing];
}

export async function writeKnowledge(records: KnowledgeRecord[]) {
  await ensureFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2));
}
