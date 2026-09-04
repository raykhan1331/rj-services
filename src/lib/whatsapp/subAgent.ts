import type { Lead } from "@/lib/leads/types";
import { WHATSAPP_CONFIG } from "./config";
import { getWhatsAppConnector } from "./connector";
import { formatOwnerNotification } from "./formatNotification";
import { appendNotification } from "./notificationLog";
import type { NotificationRecord } from "./types";

export interface SubAgentResult {
  triggered: boolean;
  record?: NotificationRecord;
}

/**
 * The WhatsApp sub-agent: the gate between lead qualification and the
 * owner notification. Only HIGH-intent leads reach a real send attempt —
 * everything else is intentionally skipped here, not just left to the
 * connector, so the "high-intent only" rule lives in one obvious place.
 */
export async function notifyOwnerOfLead(lead: Lead): Promise<SubAgentResult> {
  if (lead.intent_level !== "HIGH") {
    return { triggered: false };
  }

  const to = WHATSAPP_CONFIG.ownerNumber ?? "(owner number not configured)";
  const message = formatOwnerNotification(lead);
  const connector = getWhatsAppConnector();
  const result = await connector.sendMessage(to, message);

  const record: NotificationRecord = {
    leadId: lead.id,
    to,
    message,
    status: result.status,
    error: result.error,
    timestamp: new Date().toISOString(),
    type: "lead_alert",
  };
  await appendNotification(record);

  return { triggered: true, record };
}
