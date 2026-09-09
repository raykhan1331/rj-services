// STEP 2 Task 7 — an abstraction so a real AI provider (Gemini, Claude,
// etc.) can be plugged in later without rewriting the crawler, checks,
// scoring, or action queue, all of which are deterministic and never
// call this. The crawler/audit/GSC pipeline is unaffected by whether an
// AI provider is configured — it always works on rule-based code alone.
// See geminiProvider.ts for the first real implementation, reachable via
// POST /api/seo-agent/ai-suggest.

import { GeminiProvider } from "./geminiProvider";

export interface SeoAiSuggestion {
  page: string | null;
  suggestion: string;
  confidence: "low" | "medium" | "high";
}

export interface SeoAiAnswer {
  text: string;
}

export interface SeoAiProvider {
  readonly name: string;
  readonly isConfigured: boolean;
  /** Given an issue's context, return a natural-language suggestion. The
   * deterministic ISSUE_CATALOG in automationPolicy.ts already covers
   * this for every known issue type — a real provider would be used for
   * open-ended cases that catalog can't cover (e.g. drafting new copy),
   * not for replacing the rule-based checks themselves. */
  suggest(input: { page: string | null; issueType: string; context: string }): Promise<SeoAiSuggestion>;
  /** STEP 8 — rephrases an ALREADY-DETERMINED, deterministically-built
   * answer (`factsContext`, produced by assistant/answerGenerators.ts)
   * into more natural prose for the AI SEO Assistant. The provider is
   * explicitly told not to add facts beyond what's given — it is a
   * phrasing layer, never the source of the underlying data, so the
   * assistant's no-hallucination guarantee (Task 9) holds whether or not
   * an AI provider is configured. */
  answerQuestion(input: { question: string; factsContext: string }): Promise<SeoAiAnswer>;
}

/** Default provider: makes no network call, costs nothing, and is always
 * available. Used whenever no AI provider is configured. */
class NullAiProvider implements SeoAiProvider {
  readonly name = "none";
  readonly isConfigured = true;

  async suggest(input: { page: string | null; issueType: string; context: string }): Promise<SeoAiSuggestion> {
    return {
      page: input.page,
      suggestion: "No AI provider is configured — see the deterministic recommendedSolution from automationPolicy.ts instead.",
      confidence: "low",
    };
  }

  async answerQuestion(): Promise<SeoAiAnswer> {
    return { text: "" }; // empty — runAssistantQuery.ts falls back to the deterministic answer text when this happens
  }
}

// Real providers register themselves here by env var name — wiring one up
// is additive: implement SeoAiProvider, add it to this map, done. Gemini
// (src/lib/seo-agent/geminiProvider.ts) is the first real implementation;
// selected by setting SEO_AI_PROVIDER=gemini and GEMINI_API_KEY.
const PROVIDER_REGISTRY: Record<string, () => SeoAiProvider> = {
  gemini: () => new GeminiProvider(),
};

let cachedProvider: SeoAiProvider | null = null;

/** Reads SEO_AI_PROVIDER to pick an implementation. Falls back to
 * NullAiProvider if unset, unrecognized, or not yet implemented — the
 * rest of the SEO Agent must keep working with zero AI configured. */
export function getAiProvider(): SeoAiProvider {
  if (cachedProvider) return cachedProvider;
  const requested = process.env.SEO_AI_PROVIDER;
  const factory = requested ? PROVIDER_REGISTRY[requested] : undefined;
  cachedProvider = factory ? factory() : new NullAiProvider();
  return cachedProvider;
}
