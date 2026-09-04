import type { ChatMessage } from "@/lib/ai/types";
import { extractFacts } from "@/lib/ai/context";
import { normalizeTypos } from "@/lib/ai/fuzzy";
import { identifyProvider } from "@/lib/knowledge/retrieve";
import type { Lead, IntentLevel } from "./types";

const SERVICE_LABELS: { keywords: string[]; label: string }[] = [
  { keywords: ["bank account", "banking", "business account", "personal account"], label: "Bank Account" },
  { keywords: ["company formation", "form a company", "register a company", "incorporat"], label: "Company Formation" },
  { keywords: ["virtual address", "registered address", "company address"], label: "Virtual Address" },
  { keywords: ["kyc"], label: "KYC" },
  { keywords: ["ebay"], label: "eBay" },
  { keywords: ["shopify"], label: "Shopify" },
  { keywords: ["adsense"], label: "AdSense" },
  { keywords: ["marketing", "seo", "social media"], label: "Digital Marketing" },
  { keywords: ["loan", "finance", "lending"], label: "Business Finance" },
];

// Each signal is a distinct category of buying intent. Intent level is
// based on how many DISTINCT categories are present, never on a single
// keyword — e.g. the word "cost" alone only ever sets one signal, which is
// LOW on its own.
const RE_START_APPLICATION = /\b(i want to (apply|start|sign up|proceed|get started)|let'?s (start|proceed|do this|get started)|how do i (apply|sign up|start|get started)|ready to (start|apply|proceed)|i'?d like to (apply|start|proceed))\b/;
const RE_ASKS_DOCUMENTS = /\bwhat (do i need|documents|information)\b|\bdocuments? (do i need|are (required|needed))\b|\bwhat'?s (needed|required)\b/;
const RE_PAYMENT_PROCESS = /\b(how much|\bcost\b|\bprice\b|\bfee(s)?\b|pricing|payment|how long does it take|what'?s the process|how does (it|this) work|turnaround|timeline)\b/;
const RE_HUMAN_FOLLOWUP = /\b(call me|speak to (a|someone)|talk to (a|someone)|speak with a human|contact me|reach out to me|get in touch with me|follow up with me|followup)\b/;
const RE_PURCHASE_INTENT = /\b(i want to (open|register|form|start|set up)|i need (to open|a)|i'?m looking to|planning to (open|register|form|start))\b/;
const RE_EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const RE_PHONE = /(\+?\d[\d \-]{7,}\d)/;
const RE_NAME = /\b(my name is|i'?m called|this is)\s+([a-zA-Z][a-zA-Z'-]+(?:\s+[a-zA-Z][a-zA-Z'-]+)?)/i;
const NAME_STOPWORDS = new Set([
  "in", "on", "from", "going", "looking", "based", "also", "not", "here",
  "just", "still", "really", "very", "currently", "planning", "trying", "asking",
]);

export interface LeadSignals {
  requestedService: boolean;
  wantsToStartApplication: boolean;
  asksDocuments: boolean;
  asksPaymentOrProcess: boolean;
  providesContactInfo: boolean;
  requestsHumanFollowup: boolean;
  demonstratesPurchaseIntent: boolean;
}

function detectServiceLabel(normalizedText: string): string | null {
  for (const s of SERVICE_LABELS) {
    if (s.keywords.some((k) => normalizedText.includes(k))) return s.label;
  }
  return null;
}

function extractContact(rawUserText: string): string | null {
  const email = rawUserText.match(RE_EMAIL);
  if (email) return email[0].replace(/[.,;:!?]+$/, "");
  const phone = rawUserText.match(RE_PHONE);
  if (phone && phone[0].replace(/\D/g, "").length >= 8) return phone[0].trim();
  return null;
}

function extractName(rawUserText: string): string | null {
  const m = rawUserText.match(RE_NAME);
  if (!m) return null;
  const candidate = m[2].trim();
  const firstWord = candidate.split(/\s+/)[0].toLowerCase();
  if (NAME_STOPWORDS.has(firstWord)) return null;
  return candidate
    .split(/\s+/)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function countryLabel(location: ReturnType<typeof extractFacts>["location"]): string | null {
  if (location === "pakistan") return "Pakistan";
  if (location === "uk") return "United Kingdom";
  if (location === "outside_uk") return "Outside the UK";
  return null;
}

function joinedUserText(messages: ChatMessage[]): { raw: string; normalized: string } {
  const raw = messages
    .filter((m) => m.role === "user")
    .map((m) => m.text)
    .join(" \n ");
  return { raw, normalized: normalizeTypos(raw.toLowerCase()) };
}

export function computeSignals(messages: ChatMessage[]): LeadSignals {
  const { raw, normalized } = joinedUserText(messages);
  const provider = messages
    .filter((m) => m.role === "user")
    .map((m) => identifyProvider(m.text))
    .find(Boolean);
  const requestedService = !!provider || !!detectServiceLabel(normalized);

  return {
    requestedService,
    wantsToStartApplication: RE_START_APPLICATION.test(normalized),
    asksDocuments: RE_ASKS_DOCUMENTS.test(normalized),
    asksPaymentOrProcess: RE_PAYMENT_PROCESS.test(normalized),
    providesContactInfo: !!extractContact(raw),
    requestsHumanFollowup: RE_HUMAN_FOLLOWUP.test(normalized),
    demonstratesPurchaseIntent: RE_PURCHASE_INTENT.test(normalized) && requestedService,
  };
}

/**
 * Intent level from the NUMBER of distinct signal categories present, never
 * from a single keyword. Contact info paired with anything else is treated
 * as a strong buying signal (a customer who leaves their email/phone while
 * asking something real is a real lead), otherwise it takes several
 * distinct signals to reach HIGH.
 */
export function computeIntentLevel(signals: LeadSignals): IntentLevel {
  const count = Object.values(signals).filter(Boolean).length;
  if (count >= 4) return "HIGH";
  if (signals.providesContactInfo && count >= 2) return "HIGH";
  if (count >= 2) return "MEDIUM";
  return "LOW";
}

function summarize(messages: ChatMessage[], service: string | null, signals: LeadSignals): string {
  const bits: string[] = [service ? `Asking about ${service}.` : "General enquiry."];
  if (signals.asksDocuments) bits.push("Asked about required documents.");
  if (signals.asksPaymentOrProcess) bits.push("Asked about cost/process.");
  if (signals.wantsToStartApplication || signals.demonstratesPurchaseIntent) bits.push("Wants to proceed/start.");
  if (signals.requestsHumanFollowup) bits.push("Requested human follow-up.");
  if (signals.providesContactInfo) bits.push("Provided contact details.");
  return bits.join(" ");
}

export function buildLead(id: string, messages: ChatMessage[]): Lead {
  const { raw, normalized } = joinedUserText(messages);
  const facts = extractFacts(messages);
  const provider = messages
    .filter((m) => m.role === "user")
    .map((m) => identifyProvider(m.text))
    .find(Boolean);
  const service = provider ?? detectServiceLabel(normalized);
  const signals = computeSignals(messages);

  return {
    id,
    name: extractName(raw),
    country: countryLabel(facts.location),
    contact: extractContact(raw),
    requested_service: service ?? null,
    message_summary: summarize(messages, service ?? null, signals),
    intent_level: computeIntentLevel(signals),
    requested_followup: signals.requestsHumanFollowup,
    timestamp: new Date().toISOString(),
  };
}
