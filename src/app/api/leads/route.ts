import { NextResponse } from "next/server";
import { readLeads } from "@/lib/leads/store";

// Internal admin-only endpoint. Lead records contain personal information
// (name, contact details), so unlike the read-only knowledge-status
// endpoint this is locked by default: it requires LEADS_ADMIN_SECRET to be
// set and sent back as x-leads-secret. With no secret configured, access
// is refused rather than silently left open. Not linked from any page.
//
// This is a read surface only — nothing here sends a WhatsApp message or
// any other outbound communication. It exists so a future WhatsApp
// follow-up agent (or a human) has a defined, private place to read
// qualified leads from.

export async function GET(req: Request) {
  const requiredSecret = process.env.LEADS_ADMIN_SECRET;
  if (!requiredSecret) {
    return NextResponse.json({ error: "Leads admin access is not configured." }, { status: 501 });
  }

  const provided = req.headers.get("x-leads-secret");
  if (provided !== requiredSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const leads = await readLeads();
  return NextResponse.json({ totalLeads: leads.length, leads });
}
