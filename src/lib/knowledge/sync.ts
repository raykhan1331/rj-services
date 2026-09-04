import { fetchSource } from "./fetcher";
import { extractRequirements } from "./extract";
import { hashContent } from "./hash";
import { readKnowledge, writeKnowledge } from "./store";
import { SOURCES } from "./sources";
import type { KnowledgeRecord } from "./types";

export interface SyncResult {
  id: string;
  provider: string;
  status: "unchanged" | "changed" | "unavailable" | "first_check";
  error?: string;
}

/**
 * Official Website → Source Fetcher → Change Detection → Knowledge Database.
 *
 * Fetches one configured source, compares it against the previously stored
 * version, and only writes a new knowledge version when something actually
 * changed. Never deletes previously verified knowledge — an unreachable
 * source is marked unavailable and the last verified data is kept as-is.
 */
export async function syncSource(sourceId: string): Promise<SyncResult> {
  const config = SOURCES.find((s) => s.id === sourceId);
  if (!config) throw new Error(`Unknown source: ${sourceId}`);

  const records = await readKnowledge();
  const existingIdx = records.findIndex((r) => r.id === sourceId);
  const existing = existingIdx >= 0 ? records[existingIdx] : null;

  // A placeholder record (never_checked, no content hash) doesn't count as
  // a genuine previous version — only a record from an actual prior fetch does.
  const hadPreviousVersion = !!existing && existing.status !== "never_checked";

  const now = new Date().toISOString();
  const result = await fetchSource(config.url);

  if (!result.ok || !result.text) {
    const updated: KnowledgeRecord = existing
      ? { ...existing, status: "unavailable", lastChecked: now, lastError: result.error }
      : {
          id: config.id,
          provider: config.provider,
          type: config.type,
          sourceUrl: config.url,
          pageTitle: null,
          category: config.category,
          extractedRequirements: [],
          contentHash: null,
          version: 0,
          lastChecked: now,
          lastChanged: null,
          status: "unavailable",
          lastError: result.error,
          lastChangeSummary: null,
        };
    records[existingIdx >= 0 ? existingIdx : records.length] = updated;
    await writeKnowledge(records);
    return { id: config.id, provider: config.provider, status: "unavailable", error: result.error ?? undefined };
  }

  const newHash = hashContent(result.text);

  if (hadPreviousVersion && existing!.contentHash === newHash) {
    // Nothing changed — refresh the checked timestamp only, no new version.
    records[existingIdx] = {
      ...existing,
      lastChecked: now,
      status: "ok",
      lastError: null,
      pageTitle: result.pageTitle ?? existing.pageTitle,
    };
    await writeKnowledge(records);
    return { id: config.id, provider: config.provider, status: "unchanged" };
  }

  const requirements = extractRequirements(result.text);
  const changeSummary = hadPreviousVersion
    ? summarizeChange(existing!.extractedRequirements, requirements)
    : "Initial verified snapshot.";

  const updated: KnowledgeRecord = {
    id: config.id,
    provider: config.provider,
    type: config.type,
    sourceUrl: config.url,
    pageTitle: result.pageTitle,
    category: config.category,
    extractedRequirements: requirements,
    contentHash: newHash,
    version: (hadPreviousVersion ? existing!.version : 0) + 1,
    lastChecked: now,
    lastChanged: now,
    status: "ok",
    lastError: null,
    lastChangeSummary: changeSummary,
  };
  records[existingIdx >= 0 ? existingIdx : records.length] = updated;
  await writeKnowledge(records);
  return { id: config.id, provider: config.provider, status: hadPreviousVersion ? "changed" : "first_check" };
}

function summarizeChange(before: string[], after: string[]): string {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  const added = after.filter((r) => !beforeSet.has(r));
  const removed = before.filter((r) => !afterSet.has(r));
  const parts: string[] = [];
  if (added.length) parts.push(`${added.length} item(s) added`);
  if (removed.length) parts.push(`${removed.length} item(s) removed`);
  if (!parts.length) parts.push("Content updated");
  return parts.join(", ");
}

export async function syncAllSources(): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  for (const source of SOURCES) {
    // Sequential on purpose — a polite, low-rate crawl of real official sites.
    results.push(await syncSource(source.id));
  }
  return results;
}
