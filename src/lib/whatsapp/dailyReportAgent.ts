import type { DailySummary } from "@/lib/leads/summary";
import { WHATSAPP_CONFIG } from "./config";
import { getWhatsAppConnector } from "./connector";
import { formatDailyReport } from "./formatDailyReport";
import { appendNotification } from "./notificationLog";
import type { NotificationRecord } from "./types";

export interface DailyReportResult {
  message: string;
  record: NotificationRecord;
}

/**
 * Sends the daily summary to the owner via the same WhatsApp connector the
 * lead sub-agent uses. This function only runs when something calls it —
 * there is no scheduler here. A future cron/scheduled job (or a platform
 * scheduler, the same way Step 13B's OFFICIAL_SOURCE_SYNC_INTERVAL is
 * meant to be triggered externally) would call this once a day; nothing
 * in this codebase currently does.
 */
export async function sendDailySummaryToOwner(summary: DailySummary): Promise<DailyReportResult> {
  const to = WHATSAPP_CONFIG.ownerNumber ?? "(owner number not configured)";
  const message = formatDailyReport(summary);
  const connector = getWhatsAppConnector();
  const result = await connector.sendMessage(to, message);

  const record: NotificationRecord = {
    leadId: `daily-report:${summary.periodStart}`,
    to,
    message,
    status: result.status,
    error: result.error,
    timestamp: new Date().toISOString(),
    type: "daily_report",
  };
  await appendNotification(record);

  return { message, record };
}
