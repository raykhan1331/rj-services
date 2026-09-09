import { NextResponse } from "next/server";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";
import { computeCurrentStatus } from "@/lib/seo-agent/monitoring/currentAlerts";

// STEP 10 Task 8 — current alerts, computed read-only from already-
// persisted data (no new crawl/Google call). Also returns the current
// health score since alerts reference it (e.g. score-decline alerts).

export async function GET(req: Request) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  const { healthScore, alerts } = await computeCurrentStatus();
  return NextResponse.json({ healthScore, alerts, total: alerts.length, critical: alerts.filter((a) => a.severity === "critical").length });
}
