import { promises as fs } from "fs";
import path from "path";
import type { PageRecord, SeoActionQueueItem, SeoChangeRecord, SeoIssueRecord, SeoIssueSource } from "./types";

// File-based persistence for the SEO Agent's data model (STEP 2 Task 2) —
// same pattern as src/lib/leads/store.ts and seo-agent/history.ts. Lives
// under /data, which is git-ignored. Same known limitation as the leads
// store: a serverless deployment's filesystem isn't guaranteed to persist
// across invocations, so this is a local-dev-friendly foundation; a real
// database is a fair upgrade for a later step, not required now.

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "seo-agent-data.json");

interface StoredData {
  pages: PageRecord[];
  issues: SeoIssueRecord[];
  changes: SeoChangeRecord[];
  actions: SeoActionQueueItem[];
}

const EMPTY: StoredData = { pages: [], issues: [], changes: [], actions: [] };

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(EMPTY, null, 2));
  }
}

async function readData(): Promise<StoredData> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  try {
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY };
  }
}

async function writeData(data: StoredData) {
  await ensureFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// --- Pages ---

export async function readPages(): Promise<PageRecord[]> {
  return (await readData()).pages;
}

/** Replaces the stored record for each page's path (a crawl always
 * produces a full, current snapshot — there's nothing to merge). */
export async function upsertPages(records: PageRecord[]): Promise<void> {
  const data = await readData();
  const byPath = new Map(data.pages.map((p) => [p.path, p]));
  for (const record of records) byPath.set(record.path, record);
  data.pages = Array.from(byPath.values());
  await writeData(data);
}

// --- Issues ---

export async function readIssues(): Promise<SeoIssueRecord[]> {
  return (await readData()).issues;
}

/** Reconciles the previous issue set against what the latest run actually
 * found, SCOPED TO ONE SOURCE: issues still present stay "open" (keeping
 * their original detectedAt), issues no longer present are marked
 * "resolved" with a resolvedAt timestamp, and genuinely new issues are
 * inserted as "open". This is what makes `resolvedAt` meaningful instead
 * of always null.
 *
 * Scoping by `source` matters because the website-audit crawl (STEP 2)
 * and the Search Console analysis (STEP 3) run independently: a GSC run
 * must never mark website-audit issues "resolved" just because they
 * weren't in the GSC result set, and vice versa. Issues from OTHER
 * sources are left completely untouched. */
export async function reconcileIssues(current: SeoIssueRecord[], source: SeoIssueSource): Promise<SeoIssueRecord[]> {
  const data = await readData();
  const now = new Date().toISOString();
  const previousById = new Map(data.issues.map((i) => [i.id, i]));
  const currentIds = new Set(current.map((i) => i.id));

  const reconciledForSource: SeoIssueRecord[] = current.map((issue) => {
    const previous = previousById.get(issue.id);
    return previous ? { ...issue, detectedAt: previous.detectedAt, status: "open", resolvedAt: null } : issue;
  });

  for (const previous of data.issues) {
    if (previous.source !== source) continue; // untouched — belongs to the other source
    if (!currentIds.has(previous.id) && previous.status === "open") {
      reconciledForSource.push({ ...previous, status: "resolved", resolvedAt: now });
    } else if (!currentIds.has(previous.id)) {
      reconciledForSource.push(previous); // already resolved earlier — keep as history
    }
  }

  const otherSources = data.issues.filter((i) => i.source !== source);
  data.issues = [...otherSources, ...reconciledForSource];
  await writeData(data);
  return data.issues;
}

// --- Changes ---

export async function readChanges(): Promise<SeoChangeRecord[]> {
  return (await readData()).changes;
}

export async function appendChange(change: SeoChangeRecord): Promise<void> {
  const data = await readData();
  data.changes.push(change);
  await writeData(data);
}

// --- Action queue ---

export async function readActions(): Promise<SeoActionQueueItem[]> {
  return (await readData()).actions;
}

/** Upserts action-queue items by id, SCOPED TO ONE SOURCE (see
 * reconcileIssues for why), preserving `status` and `createdAt` for
 * anything a human has already approved/rejected/actioned — a fresh run
 * should never silently reset a decision that was already made. Items
 * whose underlying issue no longer exists (within this source) are
 * dropped; other-source items are left completely untouched. */
export async function reconcileActions(current: SeoActionQueueItem[], source: SeoIssueSource): Promise<SeoActionQueueItem[]> {
  const data = await readData();
  const previousById = new Map(data.actions.map((a) => [a.id, a]));

  const reconciledForSource = current.map((action) => {
    const previous = previousById.get(action.id);
    if (!previous) return action;
    return { ...action, status: previous.status, createdAt: previous.createdAt, updatedAt: previous.status === action.status ? previous.updatedAt : new Date().toISOString() };
  });

  const otherSources = data.actions.filter((a) => a.source !== source);
  data.actions = [...otherSources, ...reconciledForSource];
  await writeData(data);
  return data.actions;
}

/** STEP 8 Task 6 — the ONE place a human's approval decision is actually
 * recorded. Updates ONLY the `status` field of one existing action-queue
 * item — never touches the live website (this is metadata about a
 * recommendation, not the recommendation being applied). Returns null if
 * no action with that id exists, so the caller can 404 rather than
 * silently no-op. */
export async function updateActionStatus(id: string, status: SeoActionQueueItem["status"]): Promise<SeoActionQueueItem | null> {
  const data = await readData();
  const index = data.actions.findIndex((a) => a.id === id);
  if (index === -1) return null;
  const updated: SeoActionQueueItem = { ...data.actions[index], status, updatedAt: new Date().toISOString() };
  data.actions[index] = updated;
  await writeData(data);
  return updated;
}
