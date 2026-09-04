import type { Lead } from "@/lib/leads/types";

function requestedActionText(lead: Lead): string {
  if (lead.requested_followup) return "Customer requested a call/follow-up.";
  return "Reach out with relevant service information.";
}

/** Builds the exact owner-notification message from a qualified lead. */
export function formatOwnerNotification(lead: Lead): string {
  const dateTime = new Date(lead.timestamp).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

  return [
    "RJ SERVICES — NEW LEAD",
    "",
    `Name: ${lead.name ?? "Not provided"}`,
    `Country: ${lead.country ?? "Not provided"}`,
    `Service: ${lead.requested_service ?? "Not specified"}`,
    `Contact: ${lead.contact ?? "Not provided"}`,
    `Intent: ${lead.intent_level}`,
    `Summary: ${lead.message_summary}`,
    `Requested Action: ${requestedActionText(lead)}`,
    `Date/Time: ${dateTime}`,
  ].join("\n");
}
