import { NextResponse } from "next/server";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";
import { executeAction } from "@/lib/seo-agent/automation/execution";

// STEP 9 Task 1/5 — triggers real (but narrowly-scoped and gated — see
// automation/execution.ts's doc comment) execution of ONE already-
// approved action. Refuses cleanly (never throws an unhandled error that
// could leak internals) for every unsafe/invalid case.

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  const { id } = await params;

  let body: { baseUrl?: string } = {};
  try {
    body = await req.json();
  } catch {
    // No body is fine — baseUrl defaults to the configured production site.
  }

  const result = await executeAction(id, body.baseUrl);
  return NextResponse.json(result, { status: result.success ? 200 : 409 });
}
