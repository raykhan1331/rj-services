import { NextResponse } from "next/server";
import { buildSeoMap } from "@/lib/seo-agent/seoMap";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";

// Internal admin-only endpoint, same access pattern as /api/seo-agent/audit.
// Returns the STEP 2 Task 3 site map: real routes grouped by kind
// (service pages, location pages, FAQ, contact, informational, redirects).

export async function GET(req: Request) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  return NextResponse.json(buildSeoMap());
}
