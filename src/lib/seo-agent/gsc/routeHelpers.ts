import { NextResponse } from "next/server";
import { GscError, humanMessage, statusForError } from "./errors";

// STEP 3 Task 8 — every /api/seo-agent/gsc/* route funnels its error
// handling through this so the response shape (and status code) is
// consistent, and so an unexpected error NEVER leaks a stack trace,
// token, or raw Google response body to the client — it always degrades
// to a generic human-readable message instead of crashing the route.
export function gscErrorResponse(err: unknown): NextResponse {
  if (err instanceof GscError) {
    return NextResponse.json({ error: { code: err.code, message: humanMessage(err.code) } }, { status: statusForError(err.code) });
  }
  return NextResponse.json({ error: { code: "unknown-error", message: humanMessage("unknown-error") } }, { status: 500 });
}
