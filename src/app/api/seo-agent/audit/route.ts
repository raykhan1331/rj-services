import { NextResponse } from "next/server";
import { runAudit } from "@/lib/seo-agent/runAudit";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";

// Internal admin-only endpoint (see checkSeoAgentAuth for the access
// pattern). GET runs the full deterministic audit against the live site
// (or ?url= for a different target, e.g. a preview deployment) and
// returns the report. This performs only read/report/queue actions — see
// SAFE_AUTOMATION_RULES in src/lib/seo-agent/config.ts and
// automationPolicy.ts for what the agent is not allowed to do on its own.

export async function GET(req: Request) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url") ?? undefined;

  const report = await runAudit(targetUrl);
  return NextResponse.json(report);
}
