import type { StoredLead } from "./store";
import { readLeadsWithMeta } from "./store";

export interface DailySummary {
  periodStart: string;
  periodEnd: string;
  totalEnquiries: number;
  highIntent: number;
  mediumIntent: number;
  lowIntent: number;
  topServices: { service: string; count: number }[];
  newLeads: number;
  pendingFollowups: StoredLead[];
}

function inRange(iso: string, start: Date, end: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

/**
 * Computes a summary from an arbitrary set of leads and a time window —
 * kept separate from readLeadsWithMeta() so it's trivial to test with mock
 * lead data instead of the real store.
 */
export function computeSummary(leads: StoredLead[], periodStart: Date, periodEnd: Date): DailySummary {
  // "Total enquiries" = any lead touched (created or updated) in the window.
  const touchedInPeriod = leads.filter((l) => inRange(l.timestamp, periodStart, periodEnd));
  // "New leads" = sessions seen for the very first time in the window, as
  // opposed to an earlier conversation that simply continued today.
  const newLeads = leads.filter((l) => inRange(l.firstSeenAt, periodStart, periodEnd));

  const highIntent = touchedInPeriod.filter((l) => l.intent_level === "HIGH").length;
  const mediumIntent = touchedInPeriod.filter((l) => l.intent_level === "MEDIUM").length;
  const lowIntent = touchedInPeriod.filter((l) => l.intent_level === "LOW").length;

  const serviceCounts = new Map<string, number>();
  for (const l of touchedInPeriod) {
    if (!l.requested_service) continue;
    serviceCounts.set(l.requested_service, (serviceCounts.get(l.requested_service) ?? 0) + 1);
  }
  const topServices = [...serviceCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([service, count]) => ({ service, count }));

  // Follow-ups still needing action aren't scoped to "today" — nothing in
  // this system marks one as resolved yet, so every open request stays
  // visible until it's handled, regardless of which day it came in.
  const pendingFollowups = leads.filter((l) => l.requested_followup);

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    totalEnquiries: touchedInPeriod.length,
    highIntent,
    mediumIntent,
    lowIntent,
    topServices,
    newLeads: newLeads.length,
    pendingFollowups,
  };
}

/** Computes the summary for the trailing 24 hours ending at referenceDate (default: now). */
export async function computeDailySummary(referenceDate: Date = new Date()): Promise<DailySummary> {
  const leads = await readLeadsWithMeta();
  const periodEnd = referenceDate;
  const periodStart = new Date(periodEnd.getTime() - 24 * 60 * 60 * 1000);
  return computeSummary(leads, periodStart, periodEnd);
}
