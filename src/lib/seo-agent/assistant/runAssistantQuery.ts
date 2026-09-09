import { buildAssistantContext } from "./context";
import { classifyIntent } from "./intents";
import { generateAnswer, explainForPage } from "./answerGenerators";
import { getAiProvider } from "../aiProvider";
import type { AssistantAnswer } from "./types";

// STEP 8 — the assistant's entry point. Deterministic by default (Task
// 14: no paid AI API required for any of this to work) — classifies the
// question, builds the answer from cached STEP 1-7 data, and only if a
// real AI provider is configured (STEP 2's aiProvider.ts/GeminiProvider)
// asks it to rephrase the ALREADY-DETERMINED facts into more natural
// prose. The provider is never the source of the facts themselves — see
// aiProvider.ts's answerQuestion() doc comment.

const PATH_PATTERN = /\/[a-z0-9-]+(?:\/[a-z0-9-]+)*/i;

/** Task 2 — "Why is this page weak?" style questions name a real path
 * directly; when one appears in the question, per-page explanation takes
 * priority over the general intent classifier. */
function detectPagePath(question: string): string | null {
  const match = question.match(PATH_PATTERN);
  return match ? match[0].replace(/\/$/, "") || "/" : null;
}

export interface AssistantQueryResult extends AssistantAnswer {
  question: string;
  aiPolished: boolean;
  aiProvider: string;
}

export async function runAssistantQuery(question: string): Promise<AssistantQueryResult> {
  const ctx = await buildAssistantContext();
  const path = detectPagePath(question);
  const answer = path ? explainForPage(ctx, path) : generateAnswer(classifyIntent(question), ctx);

  const provider = getAiProvider();
  let text = answer.text;
  let aiPolished = false;

  if (provider.isConfigured && provider.name !== "none") {
    try {
      const polished = await provider.answerQuestion({
        question,
        // The provider only ever sees the ALREADY-COMPUTED facts, never
        // raw data it could embellish — Task 9's no-hallucination rule
        // applies to the whole pipeline, not just the deterministic half.
        factsContext: JSON.stringify({ text: answer.text, evidence: answer.evidence.slice(0, 6) }),
      });
      if (polished.text.trim()) {
        text = polished.text.trim();
        aiPolished = true;
      }
    } catch {
      // Fall back to the deterministic text — the assistant must keep
      // working with zero AI configured or available (Task 14).
    }
  }

  return { ...answer, text, question, aiPolished, aiProvider: provider.name };
}
