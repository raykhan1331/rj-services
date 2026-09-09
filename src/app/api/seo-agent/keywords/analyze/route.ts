import { NextResponse } from "next/server";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";
import { runKeywordAnalysis } from "@/lib/seo-agent/keywords/runKeywordAnalysis";
import { getConnectionStatus } from "@/lib/seo-agent/gsc/connection";
import { gscErrorResponse } from "@/lib/seo-agent/gsc/routeHelpers";
import { GscError } from "@/lib/seo-agent/gsc/errors";

// Internal admin-only endpoint (STEP 4 Task 9/13). Triggers a fresh
// keyword & search-intent analysis against the connected Search Console
// property's current 28-day period, persists the results into the
// shared issue/action-queue store (all actions forced to
// "review-required" — no automatic changes), and returns the full
// result. Since Search Console isn't actually connected yet in this
// environment, this honestly reports "not-connected" rather than
// pretending to have data — same pattern as /api/seo-agent/gsc/performance.

export async function GET(req: Request) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  try {
    const { mappings, issues, summary } = await runKeywordAnalysis();
    return NextResponse.json({
      connection: await getConnectionStatus(),
      queriesAnalyzed: mappings.length,
      opportunitiesDetected: issues.length,
      summary,
      issues,
    });
  } catch (err) {
    if (err instanceof GscError && err.code === "not-connected") {
      return NextResponse.json({ connection: await getConnectionStatus(), error: { code: err.code, message: err.message } }, { status: 409 });
    }
    return gscErrorResponse(err);
  }
}
