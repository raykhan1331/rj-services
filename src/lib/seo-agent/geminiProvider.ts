import type { SeoAiAnswer, SeoAiProvider, SeoAiSuggestion } from "./aiProvider";

// Real implementation of the SeoAiProvider interface (see aiProvider.ts),
// wired up to Google's Gemini API. GEMINI_API_KEY is read server-side
// only via process.env — this file is never imported by a "use client"
// component, and the key is never included in a thrown error, a log
// line, or an API response. Selected by setting SEO_AI_PROVIDER=gemini
// (see aiProvider.ts's PROVIDER_REGISTRY).

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
// Verified directly against the live API during setup — gemini-2.0-flash
// has since been retired; Google's own error response named this as the
// current replacement. Override via GEMINI_MODEL if this changes again.
const DEFAULT_MODEL = "gemini-3.6-flash";

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || null;
}

function getModel(): string {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

export class GeminiProvider implements SeoAiProvider {
  readonly name = "gemini";

  get isConfigured(): boolean {
    return Boolean(getApiKey());
  }

  async suggest(input: { page: string | null; issueType: string; context: string }): Promise<SeoAiSuggestion> {
    const apiKey = getApiKey();
    if (!apiKey) {
      return {
        page: input.page,
        suggestion: "Gemini is not configured (GEMINI_API_KEY is unset) — see the deterministic recommendedSolution instead.",
        confidence: "low",
      };
    }

    const prompt = [
      "You are an SEO assistant for RJ Services, a UK/Pakistan business-services company.",
      `Issue type: ${input.issueType}`,
      input.page ? `Affected page: ${input.page}` : "This issue is site-wide, not page-specific.",
      `Context: ${input.context}`,
      "In 2-3 concise sentences, give one specific, actionable suggestion to address this. Do not invent facts about the business, its partners, or its statistics.",
    ].join("\n");

    const res = await fetch(`${GEMINI_API_BASE}/${getModel()}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey, // header, not a ?key= query param, so it never lands in a URL/access log
      },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!res.ok) {
      // Deliberately generic — never forward Google's raw response body,
      // which can echo back request details.
      if (res.status === 401 || res.status === 403) throw new Error("Gemini API rejected the configured API key.");
      if (res.status === 429) throw new Error("Gemini API rate limit reached.");
      throw new Error(`Gemini API request failed with status ${res.status}.`);
    }

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return {
      page: input.page,
      suggestion: text.trim() || "Gemini returned an empty response.",
      confidence: text.trim() ? "medium" : "low",
    };
  }

  async answerQuestion(input: { question: string; factsContext: string }): Promise<SeoAiAnswer> {
    const apiKey = getApiKey();
    if (!apiKey) return { text: "" };

    const prompt = [
      "You are the internal AI SEO Assistant for RJ Services' SEO dashboard (an internal tool for the site owner, not customer-facing).",
      "You are given the ALREADY-COMPUTED facts below — a deterministic system built them from real crawl/Search Console/keyword data. Your ONLY job is to rephrase them into clear, natural prose for the owner.",
      "Rules: do not add any fact, number, URL, or claim that isn't in the JSON below. Do not claim a fix guarantees a ranking change. If the facts say data is unavailable, say so plainly. Keep it concise (3-5 sentences plus a short bullet list of the evidence items if there are any).",
      `Owner's question: ${input.question}`,
      `Facts (JSON): ${input.factsContext}`,
    ].join("\n");

    const res = await fetch(`${GEMINI_API_BASE}/${getModel()}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error("Gemini API rejected the configured API key.");
      if (res.status === 429) throw new Error("Gemini API rate limit reached.");
      throw new Error(`Gemini API request failed with status ${res.status}.`);
    }

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { text: text.trim() };
  }
}
