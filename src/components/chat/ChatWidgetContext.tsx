"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/ai/types";

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Hi, I'm the RJ AI Assistant. Ask me about our services — banking, company formation, virtual addresses, KYC, eBay, Shopify, AdSense, digital marketing, or locations. How can I help today?",
};

type Status = "idle" | "loading" | "error";

interface ChatContextValue {
  open: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  messages: ChatMessage[];
  status: Status;
  send: (text: string) => void;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatWidgetProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [status, setStatus] = useState<Status>("idle");
  const messagesRef = useRef(messages);
  const nextId = useRef(1);
  // Identifies this conversation server-side only (e.g. for lead capture).
  // Never shown in the UI.
  const sessionId = useRef(crypto.randomUUID());

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const send = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = { id: `m${nextId.current++}`, role: "user", text: trimmed };
    const payload = [...messagesRef.current, userMessage];
    setMessages(payload);
    setStatus("loading");

    fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: payload, sessionId: sessionId.current }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("assistant_error");
        const data = await res.json();
        setMessages((prev) => [...prev, { id: `m${nextId.current++}`, role: "assistant", text: data.text }]);
        setStatus("idle");
      })
      .catch(() => {
        setStatus("error");
        setMessages((prev) => [
          ...prev,
          { id: `m${nextId.current++}`, role: "assistant", text: "Something went wrong on our end. Please try again.", error: true },
        ]);
      });
  }, []);

  const clearChat = useCallback(() => {
    setMessages([WELCOME]);
    setStatus("idle");
    sessionId.current = crypto.randomUUID();
  }, []);

  return (
    <ChatContext.Provider
      value={{
        open,
        openChat: () => setOpen(true),
        closeChat: () => setOpen(false),
        toggleChat: () => setOpen((v) => !v),
        messages,
        status,
        send,
        clearChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatWidget() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatWidget must be used within a ChatWidgetProvider");
  return ctx;
}
