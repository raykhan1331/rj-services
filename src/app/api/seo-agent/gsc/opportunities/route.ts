import { NextResponse } from "next/server";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";
import { getLatestOpportunityAnalysis } from "@/lib/seo-agent/gsc/opportunityStore";

// STEP 12 — read-only. Returns the most recently computed GSC
// opportunity analysis (see gsc/opportunityAnalysis.ts), cached in
// Redis by runGscAnalysis() — never triggers a fresh Google API call
// itself (that's /api/seo-agent/gsc/performance's job). Returns an
// honest empty/null state when no analysis has run yet or the
// underlying GSC data was empty — never fabricates an opportunity.

export async function GET(req: Request) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  const analysis = await getLatestOpportunityAnalysis();
  if (!analysis) {
    return NextResponse.json({ available: false, message: "No GSC opportunity analysis has run yet. Trigger /api/seo-agent/gsc/performance first.", analysis: null });
  }
  return NextResponse.json({ available: true, analysis });
}
