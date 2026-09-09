import { promises as fs } from "fs";
import path from "path";
import type { ChangeHistoryEntry } from "../types";
import type { ChangeSnapshot } from "./types";

// STEP 9 Task 6/11 — file-based persistence, same established pattern as
// every other STEP's store.ts (data/*.json, git-ignored). Two separate
// files: snapshots (Task 6, one per execution attempt — the "what did we
// just do" record used by rollback.ts) and change history (Task 11, the
// append-only audit log with filtering).

const DATA_DIR = path.join(process.cwd(), "data");
const SNAPSHOTS_FILE = path.join(DATA_DIR, "seo-agent-snapshots.json");
const HISTORY_FILE = path.join(DATA_DIR, "seo-agent-change-history.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// --- Snapshots ---

export async function readSnapshots(): Promise<ChangeSnapshot[]> {
  return readJson<ChangeSnapshot[]>(SNAPSHOTS_FILE, []);
}

export async function appendSnapshot(snapshot: ChangeSnapshot): Promise<void> {
  const snapshots = await readSnapshots();
  snapshots.push(snapshot);
  await writeJson(SNAPSHOTS_FILE, snapshots);
}

/** The most recent successful snapshot for an action — what rollback.ts
 * restores TO. Only ever the latest, since rolling back an already
 * rolled-back change isn't a supported operation (Task 8 doesn't ask for
 * a rollback of a rollback). */
export async function getLatestSuccessfulSnapshot(actionId: string): Promise<ChangeSnapshot | null> {
  const snapshots = await readSnapshots();
  const forAction = snapshots.filter((s) => s.actionId === actionId && s.executionResult === "success");
  return forAction.length > 0 ? forAction[forAction.length - 1] : null;
}

// --- Change history ---

export async function readChangeHistory(): Promise<ChangeHistoryEntry[]> {
  return readJson<ChangeHistoryEntry[]>(HISTORY_FILE, []);
}

export async function appendChangeHistory(entry: ChangeHistoryEntry): Promise<void> {
  const history = await readChangeHistory();
  history.push(entry);
  await writeJson(HISTORY_FILE, history);
}

/** Updates the ONE existing entry for an actionId+timestamp pair (used
 * to attach a rollback outcome to the original execution entry — Task
 * 11's "rollback status" field lives on the same record, not a new one). */
export async function updateChangeHistoryEntry(id: string, patch: Partial<ChangeHistoryEntry>): Promise<ChangeHistoryEntry | null> {
  const history = await readChangeHistory();
  const index = history.findIndex((e) => e.id === id);
  if (index === -1) return null;
  history[index] = { ...history[index], ...patch };
  await writeJson(HISTORY_FILE, history);
  return history[index];
}

export interface ChangeHistoryFilter {
  since?: string; // ISO date — entries at or after this
  until?: string;
  page?: string;
  status?: ChangeHistoryEntry["executionStatus"];
  riskLevel?: ChangeHistoryEntry["riskLevel"];
  changeType?: string;
}

/** Task 11 — filtering by date/URL/status/risk/action type, all applied
 * in-memory over the (expected-small) persisted history array — no
 * database/query engine needed for this scale. */
export async function queryChangeHistory(filter: ChangeHistoryFilter): Promise<ChangeHistoryEntry[]> {
  const history = await readChangeHistory();
  return history.filter((e) => {
    if (filter.since && e.timestamp < filter.since) return false;
    if (filter.until && e.timestamp > filter.until) return false;
    if (filter.page && e.page !== filter.page) return false;
    if (filter.status && e.executionStatus !== filter.status) return false;
    if (filter.riskLevel && e.riskLevel !== filter.riskLevel) return false;
    if (filter.changeType && e.changeType !== filter.changeType) return false;
    return true;
  });
}
