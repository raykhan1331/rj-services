import { NextResponse } from "next/server";
import { crawlSite, toPageRecord } from "@/lib/seo-agent/crawler";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";
import { SEO_CONFIG } from "@/lib/seo-agent/config";

// Internal admin-only endpoint, same access pattern as /api/seo-agent/audit.
// Runs ONLY the crawler (STEP 2 Task 1) — fetch + parse every live route
// and return it in the Page data-model shape — without running the full
// scoring/issue pipeline. Useful for inspecting exactly what the crawler
// sees on a page without triggering a full audit.

export async function GET(req: Request) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url") ?? SEO_CONFIG.siteUrl;

  const crawled = await crawlSite(targetUrl);
  return NextResponse.json({ siteUrl: targetUrl, pages: crawled.map(toPageRecord) });
}
