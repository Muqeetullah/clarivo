import { useState } from "react";
import { demoConversations, type ConversationState } from "@/lib/demo-data";
export function useConversations() {
  const [conversations, setConversations] = useState(demoConversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const selected = conversations.find((c) => c.id === selectedId);
  function changeState(state: ConversationState) {
    if (!selected) return;
    const text =
      state === "closed"
        ? "Conversation closed."
        : state === "human"
          ? "Jan took over the conversation."
          : "You’re now chatting with the AI agent.";
    setConversations((current) =>
      current.map((c) =>
        c.id === selected.id
          ? {
              ...c,
              state,
              messages: [
                ...c.messages,
                {
                  id: crypto.randomUUID(),
                  author: "system",
                  body: text,
                  time: "Now",
                },
              ],
            }
          : c,
      ),
    );
  }
  function sendReply(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || selected.state === "closed" || !reply.trim()) return;
    setConversations((current) =>
      current.map((c) =>
        c.id === selected.id
          ? {
              ...c,
              state: "human",
              time: "Now",
              messages: [
                ...c.messages,
                {
                  id: crypto.randomUUID(),
                  author: "member",
                  body: reply.trim(),
                  time: "Now",
                },
              ],
            }
          : c,
      ),
    );
    setReply("");
  }

  return {
    conversations,
    selected,
    setSelectedId,
    reply,
    setReply,
    changeState,
    sendReply,
  };
}
