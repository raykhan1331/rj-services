import { NextResponse } from "next/server";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";
import { readReportHistory } from "@/lib/seo-agent/monitoring/store";
import { computeTrends } from "@/lib/seo-agent/monitoring/trends";
import { getLatestPerformance } from "@/lib/seo-agent/gsc/performanceStore";

// STEP 10 Task 9/10 — read-only report history plus the trend comparison
// between the two most recent reports. The FULL report detail (technical/
// on-page/keyword/linking/change-management sections) is already served
// by /api/seo-agent/dashboard — this endpoint is specifically the
// lightweight history + trend view Task 10 asks for.

export async function GET(req: Request) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  const [history, gscPerformance] = await Promise.all([readReportHistory(), getLatestPerformance()]);
  const sorted = [...history].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  const [current, previous] = sorted;

  return NextResponse.json({
    total: history.length,
    reports: sorted,
    trends: computeTrends(current ?? null, previous ?? null, gscPerformance),
  });
}
