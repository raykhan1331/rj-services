import { NextResponse } from "next/server";
import { checkSeoAgentAuth } from "@/lib/seo-agent/auth";
import { queryChangeHistory } from "@/lib/seo-agent/automation/store";
import type { ChangeHistoryEntry, RiskLevel } from "@/lib/seo-agent/types";

// STEP 9 Task 11 — read-only change history with filtering by date, URL,
// status, risk, and action type (all via query params, applied over the
// persisted history — no live crawl or Google call).

export async function GET(req: Request) {
  const authError = checkSeoAgentAuth(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const entries = await queryChangeHistory({
    since: searchParams.get("since") ?? undefined,
    until: searchParams.get("until") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    status: (searchParams.get("status") as ChangeHistoryEntry["executionStatus"] | null) ?? undefined,
    riskLevel: (searchParams.get("riskLevel") as RiskLevel | null) ?? undefined,
    changeType: searchParams.get("changeType") ?? undefined,
  });

  return NextResponse.json({ total: entries.length, entries });
}
