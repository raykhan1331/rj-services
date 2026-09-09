import { NextResponse } from "next/server";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";
import { getAiProvider } from "@/lib/seo-agent/aiProvider";

// Internal admin-only endpoint, same access pattern as the other
// /api/seo-agent/* routes. Invokes the configured AI provider (Gemini,
// once SEO_AI_PROVIDER=gemini and GEMINI_API_KEY are set — NullAiProvider
// otherwise, which costs nothing and always succeeds) for one issue's
// context. This is additive: nothing in the crawler/audit/GSC pipeline
// calls this — it exists so the provider can be exercised and tested
// directly, and so a future step can call it deliberately for open-ended
// cases the deterministic ISSUE_CATALOG doesn't cover.

export async function POST(req: Request) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  let body: { page?: string | null; issueType?: string; context?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON: { page?, issueType, context }." }, { status: 400 });
  }

  if (!body.issueType || !body.context) {
    return NextResponse.json({ error: "issueType and context are required." }, { status: 400 });
  }

  const provider = getAiProvider();

  try {
    const result = await provider.suggest({ page: body.page ?? null, issueType: body.issueType, context: body.context });
    return NextResponse.json({ provider: provider.name, ...result });
  } catch {
    // Never forward the raw error (could echo request/response internals)
    // — a generic message plus which provider failed is enough to debug.
    return NextResponse.json({ error: `The "${provider.name}" AI provider failed to respond.`, provider: provider.name }, { status: 502 });
  }
}
