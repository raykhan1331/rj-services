import { NextResponse } from "next/server";
import { checkSeoAgentAuthOrCron } from "@/lib/seo-agent/auth";
import { runMonitoring } from "@/lib/seo-agent/monitoring/runMonitoring";

// STEP 10 Task 1/13 — triggers one full monitoring run (technical/on-page
// /internal-linking audit, plus Search Console + keyword analysis when
// connected). GET so Vercel Cron (see vercel.json) can call it directly;
// also callable manually with the normal admin secret. Refuses to start
// if a run is already in progress (Task 13's overlap protection).

export async function GET(req: Request) {
  const authError = checkSeoAgentAuthOrCron(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const baseUrl = searchParams.get("url") ?? undefined;

  const result = await runMonitoring(baseUrl);
  if (result.skipped) {
    return NextResponse.json({ skipped: true, reason: result.skipReason }, { status: 409 });
  }
  return NextResponse.json(result);
}
