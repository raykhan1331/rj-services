import { NextResponse } from "next/server";
import { readNotifications } from "@/lib/whatsapp/notificationLog";
import { isWhatsAppConfigured } from "@/lib/whatsapp/config";

// Internal admin-only endpoint — mirrors /api/leads' access pattern.
// Locked by default: requires LEADS_ADMIN_SECRET (shared with the leads
// endpoint, since both surface the same category of sensitive data) sent
// back as x-leads-secret. Not linked from any page.

export async function GET(req: Request) {
  const requiredSecret = process.env.LEADS_ADMIN_SECRET;
  if (!requiredSecret) {
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 501 });
  }

  const provided = req.headers.get("x-leads-secret");
  if (provided !== requiredSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const notifications = await readNotifications();
  return NextResponse.json({ whatsappConfigured: isWhatsAppConfigured(), totalNotifications: notifications.length, notifications });
}
