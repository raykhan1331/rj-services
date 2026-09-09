import { NextResponse } from "next/server";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";
import { getLatestMonitoringRun, isMonitoringRunInProgress } from "@/lib/seo-agent/monitoring/store";

// STEP 10 Task 14 — read-only: the latest monitoring run's status, and
// whether one is currently in progress. No new work triggered.

export async function GET(req: Request) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  const [latestRun, inProgress] = await Promise.all([getLatestMonitoringRun(), isMonitoringRunInProgress()]);
  return NextResponse.json({ latestRun, inProgress });
}
