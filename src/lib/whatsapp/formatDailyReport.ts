import type { DailySummary } from "@/lib/leads/summary";

function followupLine(l: DailySummary["pendingFollowups"][number]): string {
  const who = l.name ?? l.contact ?? "Unnamed contact";
  const service = l.requested_service ? ` — ${l.requested_service}` : "";
  return `- ${who}${service} (${l.intent_level})`;
}

/** Builds the exact daily-report message for the owner. */
export function formatDailyReport(summary: DailySummary): string {
  const lines = [
    "RJ SERVICES — DAILY REPORT",
    "",
    `Total Leads: ${summary.totalEnquiries}`,
    `High Intent: ${summary.highIntent}`,
    `Medium Intent: ${summary.mediumIntent}`,
    `Low Intent: ${summary.lowIntent}`,
    "",
    "Top Requested Services:",
    ...(summary.topServices.length
      ? summary.topServices.map((s, i) => `${i + 1}. ${s.service} (${s.count})`)
      : ["1. None"]),
    "",
    "Important Follow-ups:",
    ...(summary.pendingFollowups.length ? summary.pendingFollowups.map(followupLine) : ["- None"]),
  ];
  return lines.join("\n");
}
