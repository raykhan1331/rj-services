import { NextResponse } from "next/server";
import { syncAllSources, syncSource } from "@/lib/knowledge/sync";

// Triggers an official-source sync. Intended to be called by an external
// scheduler (e.g. a platform cron) at the interval configured via
// OFFICIAL_SOURCE_SYNC_INTERVAL — this route does not schedule itself,
// since a serverless deployment has no long-lived process to host a timer.
//
// If KNOWLEDGE_SYNC_SECRET is set, the caller must send it as
// x-sync-secret so this endpoint can't be triggered by anyone who finds
// the URL. It's optional so local development stays simple.

export async function POST(req: Request) {
  const requiredSecret = process.env.KNOWLEDGE_SYNC_SECRET;
  if (requiredSecret) {
    const provided = req.headers.get("x-sync-secret");
    if (provided !== requiredSecret) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  const { searchParams } = new URL(req.url);
  const sourceId = searchParams.get("id");

  const results = sourceId ? [await syncSource(sourceId)] : await syncAllSources();
  return NextResponse.json({ results });
}
