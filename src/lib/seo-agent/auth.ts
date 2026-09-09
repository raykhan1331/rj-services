import { NextResponse } from "next/server";

// Shared locked-by-default admin-auth check for every /api/seo-agent/*
// route — same pattern as /api/leads/daily-summary. Requires
// SEO_AGENT_ADMIN_SECRET to be set at all (501 if not configured), and
// the caller to send it back as x-seo-agent-secret (401 otherwise).
export function checkSeoAgentAuth(req: Request): NextResponse | null {
  const requiredSecret = process.env.SEO_AGENT_ADMIN_SECRET;
  if (!requiredSecret) {
    return NextResponse.json({ error: "SEO Agent admin access is not configured." }, { status: 501 });
  }
  if (req.headers.get("x-seo-agent-secret") !== requiredSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return null;
}

/** STEP 10 Task 13 — used ONLY by the monitoring-run trigger, which
 * Vercel Cron invokes automatically (not via a browser/manual call).
 * Vercel signs scheduled requests with `Authorization: Bearer
 * $CRON_SECRET` when a project sets CRON_SECRET — accepted here as an
 * ADDITIONAL valid credential alongside the normal admin-secret header,
 * never a weaker replacement for it. Set CRON_SECRET in Vercel to the
 * SAME value as SEO_AGENT_ADMIN_SECRET so no second secret needs
 * managing. */
export function checkSeoAgentAuthOrCron(req: Request): NextResponse | null {
  const requiredSecret = process.env.SEO_AGENT_ADMIN_SECRET;
  if (!requiredSecret) {
    return NextResponse.json({ error: "SEO Agent admin access is not configured." }, { status: 501 });
  }
  if (req.headers.get("x-seo-agent-secret") === requiredSecret) return null;
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${requiredSecret}`) return null;
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}
