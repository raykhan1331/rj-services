export interface WhatsAppSendResult {
  status: "sent" | "failed" | "not_configured";
  error?: string;
}

/**
 * The connector contract. Any real provider (WhatsApp Cloud API, Twilio,
 * etc.) implements this same shape, so swapping one in later means adding
 * one new file and changing a single factory function — nothing else in
 * the lead → sub-agent → notification pipeline needs to change.
 */
export interface WhatsAppConnector {
  sendMessage(to: string, message: string): Promise<WhatsAppSendResult>;
}

export interface NotificationRecord {
  /** For a daily report this is a period label rather than a specific lead id. */
  leadId: string;
  to: string;
  message: string;
  status: WhatsAppSendResult["status"];
  error?: string;
  timestamp: string;
  type?: "lead_alert" | "daily_report";
}
