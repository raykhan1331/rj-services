import type { SearchIntent } from "../types";

// STEP 4 Task 3 — deterministic, pattern-based search-intent
// classification. No AI call, no external lookup — just word-boundary
// matching against curated term lists, checked in a fixed priority order
// so every query gets exactly one of the five real categories, or
// "unknown" when nothing matches confidently. Never guesses past
// "unknown" — a wrong confident label is worse than an honest one.

// Real UK/Pakistan location terms this business can genuinely claim
// relevance for — see config.ts's targetCountries and the real Faisalabad
// address on /locations. Deliberately NOT a long list of invented UK
// cities the business has no presence in.
// Exported so locationIntelligence.ts (Task 7) reuses this exact list
// rather than maintaining a second one.
export const LOCATION_TERMS = ["uk", "united kingdom", "england", "britain", "british", "pakistan", "faisalabad", "near me"];

const NAVIGATIONAL_TERMS = ["rj services", "rjservices", "rj service"];

const TRANSACTIONAL_TERMS = [
  "apply", "application", "register", "registration", "sign up", "signup", "open account",
  "get started", "hire", "buy", "order", "book now", "contact", "quote", "pricing",
  "price", "cost", "fees", "fee", "submit",
];

const COMMERCIAL_TERMS = ["best", "top", "vs", "versus", "compare", "comparison", "review", "reviews", "which", "alternative", "alternatives", "cheapest", "recommended"];

const INFORMATIONAL_TERMS = [
  "how", "what", "why", "when", "guide", "tutorial", "meaning", "definition",
  "requirements", "documents", "does", "checklist", "steps",
  "process", "explained", "difference between",
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Word-boundary substring match — "uk" matches "uk business bank
 * account" but not "unknown"; "vs" matches "tide vs monzo" but not
 * "reviews". Multi-word terms match as a contiguous phrase. */
function containsAny(query: string, terms: string[]): boolean {
  return terms.some((term) => new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(query));
}

/** Classifies one query. Order matters: navigational (brand) and
 * transactional (clear action intent) are checked first since they're
 * the most confidently identifiable; local is checked before
 * commercial/informational since a location term is a strong, distinct
 * signal on its own; informational is checked last since its term list
 * is the broadest/most likely to produce false positives. */
export function classifySearchIntent(query: string): SearchIntent {
  const q = query.toLowerCase().trim();
  if (!q) return "unknown";

  if (containsAny(q, NAVIGATIONAL_TERMS)) return "navigational";
  if (containsAny(q, TRANSACTIONAL_TERMS)) return "transactional";
  if (containsAny(q, LOCATION_TERMS)) return "local";
  if (containsAny(q, COMMERCIAL_TERMS)) return "commercial";
  if (containsAny(q, INFORMATIONAL_TERMS)) return "informational";
  return "unknown";
}

/** Whether `query` mentions a real target-market location term — reused
 * by locationIntelligence.ts (Task 7) so "local" detection stays in one
 * place instead of two independently-maintained checks. */
export function queryMentionsLocation(query: string): boolean {
  return containsAny(query.toLowerCase().trim(), LOCATION_TERMS);
}
