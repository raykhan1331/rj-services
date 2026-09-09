import { NextResponse } from "next/server";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";
import { runAssistantQuery } from "@/lib/seo-agent/assistant/runAssistantQuery";
import { buildAssistantContext } from "@/lib/seo-agent/assistant/context";

// STEP 8 — internal admin-only endpoint (same access pattern as every
// other /api/seo-agent/* route). Distinct from /api/assistant (the
// CUSTOMER-facing chatbot, protected under src/lib/ai/** — never touched
// by this file). POST asks the AI SEO Assistant a question; GET returns
// quick-action suggestions plus a live snapshot of key numbers for the
// dashboard's initial load — both read-only, no crawl or Google API call.

const QUICK_ACTIONS = [
  "How is my SEO performing?",
  "What should I fix first?",
  "Show my critical SEO issues.",
  "Explain my current SEO score.",
  "Which keywords have the best opportunities?",
  "Which pages have technical SEO issues?",
  "Which pages have on-page SEO issues?",
  "Which internal links should I add?",
  "Which content opportunities are most valuable?",
  "Show pending SEO approvals.",
  "What changed since the last report?",
  "Did my recent approved SEO change validate successfully?",
];

export async function GET(req: Request) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  const ctx = await buildAssistantContext();
  return NextResponse.json({
    quickActions: QUICK_ACTIONS,
    gscConnected: ctx.gscConnected,
    lastScanAt: ctx.dashboard.summary.lastScanAt,
    overallScore: ctx.dashboard.summary.overallScore,
    pendingApprovals: ctx.actions.filter((a) => a.status === "pending" || a.status === "review-required").length,
  });
}

export async function POST(req: Request) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  let body: { question?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON: { question: string }." }, { status: 400 });
  }

  const question = body.question?.trim();
  if (!question) {
    return NextResponse.json({ error: "question is required." }, { status: 400 });
  }
  // Task 13 — a hard cap, not because long input is dangerous to this
  // deterministic pipeline (it isn't executed/evaluated), but so a
  // pasted document can't be smuggled in as "a question" to extract
  // context data via an AI provider's response in unexpected ways.
  if (question.length > 500) {
    return NextResponse.json({ error: "question is too long (max 500 characters)." }, { status: 400 });
  }

  const result = await runAssistantQuery(question);
  return NextResponse.json(result);
}
