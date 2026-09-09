import { NextResponse } from "next/server";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";
import { previewBatch, executeBatch } from "@/lib/seo-agent/automation/batchOperations";

// STEP 9 Task 9 — mode: "preview" (default) shows exactly what a batch
// WOULD do (counts, URLs, types, risk levels, what's blocked and why) with
// no side effects; mode: "execute" actually runs the eligible subset.
// Never accepts an unrestricted "execute everything" request — the
// caller must always pass explicit actionIds.

export async function POST(req: Request) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  let body: { actionIds?: string[]; mode?: "preview" | "execute"; baseUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON: { actionIds: string[], mode?: \"preview\" | \"execute\" }." }, { status: 400 });
  }

  if (!Array.isArray(body.actionIds) || body.actionIds.length === 0) {
    return NextResponse.json({ error: "actionIds must be a non-empty array." }, { status: 400 });
  }

  if (body.mode === "execute") {
    const result = await executeBatch(body.actionIds, body.baseUrl);
    return NextResponse.json(result);
  }

  const preview = await previewBatch(body.actionIds);
  return NextResponse.json(preview);
}
