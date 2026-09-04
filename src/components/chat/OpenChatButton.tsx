"use client";

import { useChatWidget } from "./ChatWidgetContext";

export default function OpenChatButton({ className }: { className?: string }) {
  const { openChat } = useChatWidget();
  return (
    <button type="button" onClick={openChat} className={className}>
      Open AI Assistant
    </button>
  );
}
