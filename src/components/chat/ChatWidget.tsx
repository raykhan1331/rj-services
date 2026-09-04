"use client";

import { useEffect, useRef, useState } from "react";
import { useChatWidget } from "./ChatWidgetContext";
import { IconChat, IconClose, IconSend, IconTrash } from "@/components/home/icons";

function TypingIndicator() {
  return (
    <div className="mr-auto flex max-w-[85%] items-center gap-1 rounded-2xl rounded-bl-sm bg-white/10 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export default function ChatWidget() {
  const { open, toggleChat, closeChat, messages, status, send, clearChat } = useChatWidget();
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || status === "loading") return;
    send(input);
    setInput("");
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleChat}
        aria-label="Open RJ AI Assistant"
        className="fixed bottom-6 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-2xl hover:opacity-90 hover:scale-105"
      >
        <IconChat className="w-6 h-6" />
      </button>

      <div
        aria-hidden={!open}
        className={`fixed z-50 left-4 right-4 top-20 bottom-24 sm:left-auto sm:top-auto sm:right-6 sm:bottom-24 sm:h-[560px] sm:w-96 flex flex-col rounded-2xl border border-white/10 bg-black shadow-2xl overflow-hidden transition-all duration-200 ease-out ${
          open ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95 pointer-events-none"
        }`}
      >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-white">RJ AI Assistant</p>
              <p className="text-xs text-zinc-500">Usually replies instantly</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={clearChat} aria-label="Clear chat" className="p-2 text-zinc-400 hover:text-white">
                <IconTrash className="w-4 h-4" />
              </button>
              <button type="button" onClick={closeChat} aria-label="Close chat" className="p-2 text-zinc-400 hover:text-white">
                <IconClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-white text-black px-4 py-2.5 text-sm"
                    : `mr-auto max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-white ${
                        m.error ? "bg-red-500/10 border border-red-400/30" : "bg-white/10"
                      }`
                }
              >
                {m.text}
              </div>
            ))}
            {status === "loading" && <TypingIndicator />}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-white/10 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about our services..."
              className="flex-1 rounded-full border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
            />
            <button
              type="submit"
              disabled={!input.trim() || status === "loading"}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:opacity-40"
            >
              <IconSend className="w-4 h-4" />
            </button>
          </form>
        </div>
    </>
  );
}
