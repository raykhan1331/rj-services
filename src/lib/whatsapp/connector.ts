import { WHATSAPP_CONFIG, isWhatsAppConfigured } from "./config";
import type { WhatsAppConnector, WhatsAppSendResult } from "./types";

/**
 * Stub connector used whenever WhatsApp isn't configured yet. It never
 * makes a network call — it just reports that clearly, so the rest of the
 * pipeline (lead qualification, notification formatting, logging) can be
 * built and tested end-to-end before any real credentials exist.
 */
class NotConfiguredConnector implements WhatsAppConnector {
  async sendMessage(): Promise<WhatsAppSendResult> {
    return { status: "not_configured", error: "WhatsApp API credentials are not configured." };
  }
}

/**
 * Real WhatsApp Cloud API (Meta's official Business API) connector. Only
 * ever instantiated when WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID
 * are both set — see getWhatsAppConnector() below. Credentials are read
 * from environment variables only; nothing is hardcoded here.
 */
class WhatsAppCloudApiConnector implements WhatsAppConnector {
  async sendMessage(to: string, message: string): Promise<WhatsAppSendResult> {
    const { apiToken, phoneNumberId } = WHATSAPP_CONFIG;
    if (!apiToken || !phoneNumberId) {
      return { status: "not_configured", error: "WhatsApp API credentials are not configured." };
    }

    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: message },
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return { status: "failed", error: `WhatsApp API error (${res.status}): ${detail.slice(0, 200)}` };
      }
      return { status: "sent" };
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : "WhatsApp send failed" };
    }
  }
}

/** Returns the real connector once credentials exist, otherwise the safe stub. */
export function getWhatsAppConnector(): WhatsAppConnector {
  return isWhatsAppConfigured() ? new WhatsAppCloudApiConnector() : new NotConfiguredConnector();
}
