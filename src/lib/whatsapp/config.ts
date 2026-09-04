// Central WhatsApp configuration. Nothing here is a hardcoded credential —
// every value is read from the environment, and the connector (see
// connector.ts) only activates once all of them are actually present.

export const WHATSAPP_CONFIG = {
  /** WhatsApp Cloud API (Meta) access token — server-only, never sent to the browser. */
  apiToken: process.env.WHATSAPP_API_TOKEN ?? null,
  /** WhatsApp Cloud API phone number ID the messages are sent from. */
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? null,
  /** The owner's WhatsApp number that receives lead notifications, in E.164 format. */
  ownerNumber: process.env.OWNER_WHATSAPP_NUMBER ?? null,
};

export function isWhatsAppConfigured(): boolean {
  return !!(WHATSAPP_CONFIG.apiToken && WHATSAPP_CONFIG.phoneNumberId && WHATSAPP_CONFIG.ownerNumber);
}
