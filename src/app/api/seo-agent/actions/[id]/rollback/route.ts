import { NextResponse } from "next/server";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";
import { previewRollback, confirmRollback } from "@/lib/seo-agent/automation/rollback";

// STEP 9 Task 8 — GET previews what a rollback would restore (read-only,
// Task 8 steps 1-2); POST actually performs it, and ONLY when the request
// body explicitly sets confirm:true (Task 8 step 3, "require
// confirmation" — "never perform silent rollback").

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;
  const { id } = await params;
  const preview = await previewRollback(id);
  return NextResponse.json(preview);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;
  const { id } = await params;

  let body: { confirm?: boolean; baseUrl?: string } = {};
  try {
    body = await req.json();
  } catch {
    // treated as confirm: false below
  }

  if (body.confirm !== true) {
    const preview = await previewRollback(id);
    return NextResponse.json({ ...preview, note: "Rollback not performed — resend with { \"confirm\": true } to actually restore the previous value." }, { status: 400 });
  }

  const result = await confirmRollback(id, body.baseUrl);
  return NextResponse.json(result, { status: result.success ? 200 : 409 });
}
