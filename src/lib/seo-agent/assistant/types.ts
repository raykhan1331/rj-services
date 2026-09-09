import type { AssistantIntent } from "./intents";

// STEP 8 — presentation types for the assistant's answers. Kept separate
// from the core SEO data model (types.ts) since these are specific to
// how the assistant packages evidence for display, not detected SEO
// issues themselves.

/** Task 3 — one piece of evidence backing an answer, traceable to real
 * data. Every field is optional because not every answer type has every
 * field (a score explanation has no single URL; a page-level issue does). */
export interface AssistantEvidenceItem {
  url?: string;
  metric?: string;
  currentValue?: string;
  issue?: string;
  reason?: string;
  recommendedAction?: string;
  actionId?: string;
}

export interface AssistantAnswer {
  intent: AssistantIntent;
  text: string;
  evidence: AssistantEvidenceItem[];
  relatedActionIds: string[];
  /** Task 9 — whether this answer's evidence drew on real Search Console
   * data (true) or only on-page/crawl/technical evidence (false) — always
   * stated, never left ambiguous. */
  gscUsed: boolean;
}
