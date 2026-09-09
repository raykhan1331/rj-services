import { NextResponse } from "next/server";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";
import { buildAuthUrl } from "@/lib/seo-agent/gsc/oauthClient";
import { gscErrorResponse } from "@/lib/seo-agent/gsc/routeHelpers";

// Internal admin-only endpoint, same access pattern as the other
// /api/seo-agent/* routes. Returns the Google consent-screen URL as JSON
// rather than issuing an HTTP redirect itself — the code exchange has to
// happen in the site owner's OWN browser (where they're logged into the
// Google account that owns/manages the Search Console property), not in
// whatever tool (curl, this API) is calling this endpoint. Open the
// returned authUrl in a real browser to actually authorize.

export async function GET(req: Request) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  try {
    const authUrl = await buildAuthUrl();
    return NextResponse.json({ authUrl, instructions: "Open this URL in a browser logged into the Google account that manages the Search Console property, then approve read-only access." });
  } catch (err) {
    return gscErrorResponse(err);
  }
}
