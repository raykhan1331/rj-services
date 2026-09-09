import { NextResponse } from "next/server";
import { readActions } from "@/lib/seo-agent/store";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";

// Internal admin-only endpoint, same access pattern as /api/seo-agent/audit.
// Read-only: returns the current SEO action queue (STEP 2 Task 5) as last
// written by runAudit(). There is deliberately no POST/PATCH here yet —
// approving, rejecting, or applying an action is a decision for a human,
// and no future step should wire that up without this endpoint also
// gaining real authentication beyond a single shared secret.

export async function GET(req: Request) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  const actions = await readActions();
  return NextResponse.json({
    total: actions.length,
    pending: actions.filter((a) => a.status === "pending").length,
    // STEP 5 Task 6 — audit and search-console-cross-check items now
    // default to "review-required" rather than "pending" (see
    // runAudit.ts/runGscAnalysis.ts); surfaced as its own count so
    // existing "pending" consumers keep working unchanged.
    reviewRequired: actions.filter((a) => a.status === "review-required").length,
    actions,
  });
}
