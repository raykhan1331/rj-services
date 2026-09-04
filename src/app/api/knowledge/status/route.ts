import { NextResponse } from "next/server";
import { readKnowledge } from "@/lib/knowledge/store";
import { OFFICIAL_SOURCE_SYNC_INTERVAL_SECONDS } from "@/lib/knowledge/config";

// Internal admin/developer visibility endpoint — read-only. Not linked from
// any page; intended for direct inspection during development or by an
// internal ops dashboard later.

export async function GET() {
  const records = await readKnowledge();

  const sources = records.map((r) => ({
    id: r.id,
    provider: r.provider,
    category: r.category,
    sourceUrl: r.sourceUrl,
    lastSuccessfulCheck: r.status !== "never_checked" ? r.lastChecked : null,
    lastDetectedChange: r.lastChanged,
    knowledgeVersion: r.version,
    status: r.status,
    error: r.lastError,
  }));

  return NextResponse.json({
    syncIntervalSeconds: OFFICIAL_SOURCE_SYNC_INTERVAL_SECONDS,
    totalSources: sources.length,
    sources,
  });
}
