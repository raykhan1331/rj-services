import { NextResponse } from "next/server";
import { computeDailySummary } from "@/lib/leads/summary";
import { formatDailyReport } from "@/lib/whatsapp/formatDailyReport";
import { sendDailySummaryToOwner } from "@/lib/whatsapp/dailyReportAgent";

// Internal admin-only endpoint (same access pattern as /api/leads and
// /api/whatsapp/notifications). GET computes and previews today's summary
// without sending anything. POST additionally attempts a send through the
// WhatsApp connector — still safe with no credentials configured, since
// the connector no-ops in that case. Neither is on any schedule; both are
// on-demand only, for a future scheduler (or a person) to call.

function checkAuth(req: Request): NextResponse | null {
  const requiredSecret = process.env.LEADS_ADMIN_SECRET;
  if (!requiredSecret) {
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 501 });
  }
  if (req.headers.get("x-leads-secret") !== requiredSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const authError = checkAuth(req);
  if (authError) return authError;

  const summary = await computeDailySummary();
  return NextResponse.json({ summary, message: formatDailyReport(summary) });
}

export async function POST(req: Request) {
  const authError = checkAuth(req);
  if (authError) return authError;

  const summary = await computeDailySummary();
  const result = await sendDailySummaryToOwner(summary);
  return NextResponse.json({ summary, ...result });
}
