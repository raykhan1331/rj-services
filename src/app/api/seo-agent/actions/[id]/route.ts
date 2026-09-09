import { NextResponse } from "next/server";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";
import { updateActionStatus } from "@/lib/seo-agent/store";
import type { ActionStatus } from "@/lib/seo-agent/types";

// STEP 8 Task 6 — lets a human record an approval decision on one
// action-queue item. This is THE approval workflow, not a bypass of it:
// it only ever changes the `status` metadata field on a queue record,
// never touches the live website, and the allowed target statuses are
// deliberately restricted to human decisions — "done"/"failed" are
// execution-outcome states nothing in this codebase produces
// automatically, so they're not settable here either.

const ALLOWED_STATUSES = new Set<ActionStatus>(["approved", "rejected", "skipped", "review-required"]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  const { id } = await params;

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON: { status: \"approved\" | \"rejected\" | \"skipped\" | \"review-required\" }." }, { status: 400 });
  }

  if (!body.status || !ALLOWED_STATUSES.has(body.status as ActionStatus)) {
    return NextResponse.json({ error: `status must be one of: ${Array.from(ALLOWED_STATUSES).join(", ")}.` }, { status: 400 });
  }

  const updated = await updateActionStatus(id, body.status as ActionStatus);
  if (!updated) {
    return NextResponse.json({ error: `No action found with id "${id}".` }, { status: 404 });
  }

  return NextResponse.json({ action: updated });
}
