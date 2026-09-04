export type IntentLevel = "LOW" | "MEDIUM" | "HIGH";

export interface Lead {
  /** Internal record key (per chat session) — not one of the spec'd content fields, but needed to store/update a record. */
  id: string;
  name: string | null;
  country: string | null;
  contact: string | null;
  requested_service: string | null;
  message_summary: string;
  intent_level: IntentLevel;
  requested_followup: boolean;
  timestamp: string;
}
