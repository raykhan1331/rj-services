import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/seo-agent/dashboard";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";

// Internal admin-only endpoint, same access pattern as /api/seo-agent/audit.
// Read-only: returns the latest stored audit, score history, and a flat
// summary (STEP 2 Task 8) for a future dashboard UI to render. Never runs
// a new audit itself — call /api/seo-agent/audit first (or on a schedule)
// to produce data for this to read.

export async function GET(req: Request) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  const data = await getDashboardData();
  return NextResponse.json(data);
}
