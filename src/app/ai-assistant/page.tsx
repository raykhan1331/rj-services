import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import Reveal from "@/components/home/Reveal";
import OpenChatButton from "@/components/chat/OpenChatButton";
import { IconBot, IconCheck } from "@/components/home/icons";

export const metadata: Metadata = {
  title: "RJ AI Assistant",
  description:
    "Chat with the RJ AI Assistant for instant answers about banking, UK company formation, KYC, e-commerce, and more — available on every page.",
  alternates: { canonical: "/ai-assistant" },
};

const features = [
  "Answers to common service questions",
  "FAQ answers, right in the chat",
  "Service recommendations based on your needs",
  "Enquiry collection so our team can follow up",
  "Conversation history saved for your session",
];

export default function AiAssistantPage() {
  return (
    <div className="bg-black text-white">
      <Container>
        <div className="py-20 sm:py-24 text-center max-w-2xl mx-auto flex flex-col items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <IconBot className="w-8 h-8" />
          </div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">RJ AI Assistant</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">Ask, Explore, Get Guided</h1>
          <p className="text-zinc-400">
            Our AI Assistant is available on every page &mdash; look for the chat button in the
            bottom-right corner &mdash; to help answer questions about our services and point you in
            the right direction.
          </p>
          <OpenChatButton className="rounded-full bg-white text-black px-8 py-3.5 text-sm font-medium hover:opacity-90" />
        </div>
      </Container>

      <Reveal>
        <Container>
          <div className="pb-24 max-w-xl mx-auto">
            <ul className="space-y-4">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <IconCheck className="w-5 h-5 shrink-0 text-white mt-0.5" />
                  <span className="text-sm text-zinc-300">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Reveal>
    </div>
  );
}
