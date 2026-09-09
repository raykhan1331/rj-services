// STEP 8 Task 2/8 — deterministic, pattern-based question routing (same
// approach as STEP 4's intentClassifier.ts: no AI call required for the
// assistant's core function to work). Order matters — rules are checked
// top to bottom, so more specific phrasings are listed before broader
// ones that could otherwise swallow them.

export type AssistantIntent =
  | "pending-approvals"
  | "history-changes"
  | "score-explanation"
  | "orphan-pages"
  | "internal-link-opportunities"
  | "content-opportunities"
  | "ctr-problems"
  | "keyword-opportunities"
  | "technical-issues"
  | "onpage-issues"
  | "action-explain"
  | "fix-first"
  | "biggest-problems"
  | "gsc-status"
  | "seo-performance"
  | "validation-check"
  | "unknown";

interface IntentRule {
  intent: AssistantIntent;
  /** Any one of these exact substrings matches. */
  terms?: string[];
  /** Any one of these word GROUPS matches when every word in the group
   * appears somewhere in the question (any order/position) — for phrasing
   * too variable for a single fixed substring, e.g. "explain my CURRENT
   * SEO score" vs. "why is my score so low". */
  anyOf?: string[][];
}

const RULES: IntentRule[] = [
  { intent: "validation-check", terms: ["validate", "validated", "validation"], anyOf: [["recent", "change"], ["did", "change"]] },
  { intent: "seo-performance", terms: ["how is my seo", "seo performing", "seo health", "overall health", "performance overview"], anyOf: [["how", "performing"], ["seo", "doing"]] },
  { intent: "pending-approvals", terms: ["pending approval", "waiting for approval", "review required", "action queue", "approvals", "pending"] },
  { intent: "history-changes", terms: ["what changed", "what improved", "got worse", "worsened", "worsening", "resolved", "new issues appeared", "since last scan", "since the last scan", "compared to last", "previous scan"] },
  { intent: "score-explanation", terms: ["score change"], anyOf: [["explain", "score"], ["why", "score"]] },
  { intent: "orphan-pages", terms: ["orphan"] },
  { intent: "internal-link-opportunities", terms: ["internal link", "link opportunit", "which links should", "add a link"] },
  { intent: "content-opportunities", terms: ["content opportunit", "content gap", "what content should", "new page opportunit", "supporting content"] },
  { intent: "ctr-problems", terms: ["ctr", "click-through", "click through rate", "low clicks", "weak clicks"] },
  { intent: "keyword-opportunities", terms: ["keyword", "search intent", "which quer", "target quer"] },
  { intent: "technical-issues", terms: ["technical seo", "technical issue", "crawlab", "indexab", "sitemap", "robots.txt", "robots directive", "canonical", "noindex", "redirect"] },
  { intent: "onpage-issues", terms: ["on-page", "on page seo", "titles", "title tag", "meta description", " h1", "heading", "alt text"] },
  { intent: "biggest-problems", terms: ["biggest problem", "critical issue", "critical seo", "worst issue", "major issue", "critical error"] },
  { intent: "fix-first", terms: ["fix first", "what should i fix", "priorit", "start with", "tackle first"] },
  { intent: "gsc-status", terms: ["search console", " gsc", "gsc "] },
];

export function classifyIntent(question: string): AssistantIntent {
  const q = ` ${question.toLowerCase().trim()} `;
  for (const rule of RULES) {
    if (rule.terms?.some((t) => q.includes(t))) return rule.intent;
    if (rule.anyOf?.some((group) => group.every((word) => q.includes(word)))) return rule.intent;
  }
  return "unknown";
}
