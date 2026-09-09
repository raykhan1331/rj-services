import { NextResponse } from "next/server";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";
import { getConnectionStatus } from "@/lib/seo-agent/gsc/connection";

// Internal admin-only endpoint. Returns connection metadata only — never
// a token value (see gsc/connection.ts).

export async function GET(req: Request) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  const status = await getConnectionStatus();
  return NextResponse.json(status);
}
