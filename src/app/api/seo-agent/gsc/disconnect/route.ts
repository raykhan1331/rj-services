import { NextResponse } from "next/server";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";
import { clearTokens } from "@/lib/seo-agent/gsc/tokenStore";

// Internal admin-only endpoint. Revokes the local record of the
// connection (deletes the stored tokens). Does not call Google's revoke
// endpoint — the site owner can also revoke access directly from
// https://myaccount.google.com/permissions if they want to fully cut
// Google-side access, not just this app's local copy of the token.

export async function POST(req: Request) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  await clearTokens();
  return NextResponse.json({ disconnected: true });
}
