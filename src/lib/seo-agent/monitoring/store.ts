import { promises as fs } from "fs";
import path from "path";
import type { MonitoringRun, SeoReportHistoryEntry } from "../types";

// STEP 10 Task 10/13/14 — file-based persistence, same established
// pattern as every other store.ts in this codebase. Two files: monitoring
// runs (the wrapping run's own lifecycle) and lightweight report history
// (Task 10, used for trend comparisons — trends.ts).

const DATA_DIR = path.join(process.cwd(), "data");
const RUNS_FILE = path.join(DATA_DIR, "seo-agent-monitoring-runs.json");
const REPORTS_FILE = path.join(DATA_DIR, "seo-agent-report-history.json");
const LOCK_FILE = path.join(DATA_DIR, "seo-agent-monitoring.lock");
const MAX_RUNS = 50;
const MAX_REPORTS = 50;

// Task 13/14 — a run older than this is assumed to have died without
// completing cleanly (e.g. the process was killed) rather than still be
// genuinely in progress; treated as stale so a new run isn't blocked
// forever by a crashed one.
const MAX_RUN_DURATION_MS = 15 * 60 * 1000;

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

// --- Monitoring runs ---

export async function readMonitoringRuns(): Promise<MonitoringRun[]> {
  return readJson<MonitoringRun[]>(RUNS_FILE, []);
}

export async function getLatestMonitoringRun(): Promise<MonitoringRun | null> {
  const runs = await readMonitoringRuns();
  return runs.length > 0 ? runs[runs.length - 1] : null;
}

/** Task 13 — "prevent duplicate scheduled jobs" / "prevent overlapping
 * runs": true only when the latest run is still genuinely in flight
 * (queued/running AND started recently enough to plausibly still be
 * alive). */
export async function isMonitoringRunInProgress(): Promise<boolean> {
  const latest = await getLatestMonitoringRun();
  if (!latest) return false;
  if (latest.status !== "queued" && latest.status !== "running") return false;
  const age = Date.now() - new Date(latest.startedAt).getTime();
  return age < MAX_RUN_DURATION_MS;
}

/** Task 13/14 — the real overlap guard. `isMonitoringRunInProgress()`
 * (read-then-decide) has a TOCTOU race under real concurrent requests:
 * two requests can both see "not in progress" before either has appended
 * its own run record, and the subsequent unsynchronized read-modify-write
 * of RUNS_FILE from each can even silently drop one run's record. `wx`
 * (exclusive create) is atomic at the filesystem level — only one
 * concurrent caller can win — so this is the actual mutex; the run-history
 * check above remains only for informational display (e.g. the dashboard
 * "last run" status), not for gating a new run. Returns true if the lock
 * was acquired (caller must releaseMonitoringLock() when done, in a
 * finally block so a thrown error can't leak the lock).
 */
export async function acquireMonitoringLock(): Promise<boolean> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const handle = await fs.open(LOCK_FILE, "wx");
    await handle.writeFile(String(Date.now()));
    await handle.close();
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
  }
  // A lock file already exists — if it's older than the same staleness
  // window used for run records, assume the process that held it died
  // without cleaning up, and steal it rather than blocking forever.
  try {
    const raw = await fs.readFile(LOCK_FILE, "utf-8");
    const lockedAt = Number(raw);
    if (Number.isFinite(lockedAt) && Date.now() - lockedAt >= MAX_RUN_DURATION_MS) {
      await fs.rm(LOCK_FILE, { force: true });
      return acquireMonitoringLock();
    }
  } catch {
    // Lock file vanished between the failed open and this read — safe to retry once.
  }
  return false;
}

export async function releaseMonitoringLock(): Promise<void> {
  await fs.rm(LOCK_FILE, { force: true });
}

export async function appendMonitoringRun(run: MonitoringRun): Promise<void> {
  const runs = await readMonitoringRuns();
  runs.push(run);
  await writeJson(RUNS_FILE, runs.slice(-MAX_RUNS));
}

export async function updateMonitoringRun(id: string, patch: Partial<MonitoringRun>): Promise<MonitoringRun | null> {
  const runs = await readMonitoringRuns();
  const index = runs.findIndex((r) => r.id === id);
  if (index === -1) return null;
  runs[index] = { ...runs[index], ...patch };
  await writeJson(RUNS_FILE, runs);
  return runs[index];
}

// --- Report history ---

export async function readReportHistory(): Promise<SeoReportHistoryEntry[]> {
  return readJson<SeoReportHistoryEntry[]>(REPORTS_FILE, []);
}

export async function appendReportHistory(entry: SeoReportHistoryEntry): Promise<void> {
  const history = await readReportHistory();
  history.push(entry);
  await writeJson(REPORTS_FILE, history.slice(-MAX_REPORTS));
}

export async function getLatestReport(): Promise<SeoReportHistoryEntry | null> {
  const history = await readReportHistory();
  return history.length > 0 ? history[history.length - 1] : null;
}

export async function getPreviousReport(): Promise<SeoReportHistoryEntry | null> {
  const history = await readReportHistory();
  return history.length > 1 ? history[history.length - 2] : null;
}
