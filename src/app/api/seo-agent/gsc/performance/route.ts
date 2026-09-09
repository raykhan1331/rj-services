import { NextResponse } from "next/server";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";
import { runGscAnalysis } from "@/lib/seo-agent/gsc/runGscAnalysis";
import { getConnectionStatus } from "@/lib/seo-agent/gsc/connection";
import { gscErrorResponse } from "@/lib/seo-agent/gsc/routeHelpers";
import { GscError } from "@/lib/seo-agent/gsc/errors";

// Internal admin-only endpoint. Triggers a FRESH Search Console fetch
// (current + previous 28-day periods — STEP 3 Task 3), runs the
// deterministic opportunity rules (Task 4), persists both into the
// shared STEP 2 issue/action-queue store (Task 5), and returns the full
// result. If the connection has expired/been revoked, this surfaces
// that clearly rather than pretending to have data (Task 8/10).

export async function GET(req: Request) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  try {
    const { comparison, issues } = await runGscAnalysis();
    const hasData = comparison.current.totalClicks > 0 || comparison.current.totalImpressions > 0;
    return NextResponse.json({
      connection: await getConnectionStatus(),
      performance: comparison,
      hasData,
      opportunities: {
        critical: issues.filter((i) => i.severity === "critical").length,
        warning: issues.filter((i) => i.severity === "warning").length,
        opportunity: issues.filter((i) => i.severity === "opportunity").length,
      },
      issues,
    });
  } catch (err) {
    if (err instanceof GscError && err.code === "not-connected") {
      return NextResponse.json({ connection: await getConnectionStatus(), error: { code: err.code, message: err.message } }, { status: 409 });
    }
    return gscErrorResponse(err);
  }
}
