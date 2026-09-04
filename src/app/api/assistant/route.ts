import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAssistantReply } from "@/lib/ai/responder";
import { SYSTEM_PROMPT } from "@/lib/ai/systemPrompt";
import type { ChatMessage } from "@/lib/ai/types";
import { findRelevantKnowledge, formatKnowledgeAnswer, formatKnowledgeForPrompt, identifyProvider } from "@/lib/knowledge/retrieve";
import { composeAnswer } from "@/lib/ai/compose";
import { buildLead } from "@/lib/leads/qualify";
import { upsertLead } from "@/lib/leads/store";
import { notifyOwnerOfLead } from "@/lib/whatsapp/subAgent";

// Server-only route. The Anthropic API key is read from an environment
// variable here and is never sent to, or accessible from, the browser.

export async function POST(req: Request) {
  let body: { messages?: ChatMessage[]; sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = (body.messages ?? []).filter((m) => m.text?.trim());
  const lastUser = [...messages].reverse().find((m) => m.role === "user");

  if (!lastUser) {
    return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Verified official-source knowledge relevant to this question, if any.
  // Sourced from the knowledge database kept up to date by the official-
  // source monitoring system (see src/lib/knowledge), never invented here.
  const knowledge = await findRelevantKnowledge(lastUser.text);

  let result: { text: string; source: string } | null = null;

  // No key configured yet: reason over the full conversation with the
  // local intent-understanding engine first — it handles multi-part
  // questions, conversation memory, and provider/company-formation
  // reasoning using verified knowledge. Only fall further back when it
  // genuinely can't address anything in the message.
  if (!apiKey) {
    const composed = await composeAnswer(messages);
    if (composed) {
      result = { text: composed, source: "fallback-reasoned" };
    } else {
      const hasUsefulContent = knowledge.some((r) => r.extractedRequirements.length > 0);
      if (knowledge.length && hasUsefulContent) {
        const providerIdentified = !!identifyProvider(lastUser.text);
        result = { text: formatKnowledgeAnswer(knowledge, providerIdentified), source: "fallback-knowledge" };
      } else {
        const fallback = await getAssistantReply(lastUser.text, false);
        result = { text: fallback.text, source: "fallback" };
      }
    }
  } else {
    try {
      const anthropic = new Anthropic({ apiKey });
      const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
      const systemWithKnowledge = SYSTEM_PROMPT + formatKnowledgeForPrompt(knowledge);

      const response = await anthropic.messages.create({
        model,
        max_tokens: 500,
        system: systemWithKnowledge,
        messages: messages.map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("assistant" as const),
          content: m.text,
        })),
      });

      const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();

      result = {
        text: text || "I'm sorry, I wasn't able to generate a response. Please try again or contact our team.",
        source: "ai",
      };
    } catch (err) {
      console.error("RJ Assistant API error:", err);
      return NextResponse.json(
        { error: "The assistant is temporarily unavailable. Please try again shortly." },
        { status: 502 }
      );
    }
  }

  // Lead qualification runs server-side only, after the reply is ready.
  // The lead record is stored internally for a future follow-up process —
  // it is never included in the response sent back to the browser.
  if (body.sessionId) {
    try {
      const lead = buildLead(body.sessionId, [...messages, { id: "reply", role: "assistant", text: result.text }]);
      await upsertLead(lead);
      // Customer -> Assistant -> Lead Qualification -> High-Intent Lead -> WhatsApp Sub-Agent -> Owner Notification.
      // The sub-agent itself gates on intent_level === "HIGH".
      await notifyOwnerOfLead(lead);
    } catch (err) {
      console.error("Lead qualification / notification error:", err);
    }
  }

  return NextResponse.json({ text: result.text, source: result.source });
}
