"use client";
import { useMemo } from "react";
import { Avatar as DiceBearAvatar, Style } from "@dicebear/core";
import thumbs from "@dicebear/styles/thumbs.json";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Conversation } from "@/lib/demo-data";
const style = new Style(thumbs);
export function visitorLabel(conversation: Conversation) {
  return `Visitor from ${conversation.location.split(",")[0]}`;
}
export function InboxAvatar({
  seed,
  label,
  size = "default",
}: {
  seed: string;
  label: string;
  size?: "default" | "sm" | "lg";
}) {
  const uri = useMemo(
    () =>
      new DiceBearAvatar(style, {
        seed,
        borderRadius: 50,
        size: 64,
        backgroundColor: ["#c8e9e4", "#f5edcc", "#dbe7fb", "#f8d8c2"],
      }).toDataUri(),
    [seed],
  );
  return (
    <Avatar size={size} className="inbox-dice-avatar">
      <AvatarImage src={uri} alt="" />
      <AvatarFallback>{label.slice(0, 1)}</AvatarFallback>
    </Avatar>
  );
}
