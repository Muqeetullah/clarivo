"use client";
import { useMemo } from "react";
import { Avatar as DiceBearAvatar, Style } from "@dicebear/core";
import thumbs from "@dicebear/styles/thumbs.json";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
const style = new Style(thumbs);
export function PersonAvatar({
  seed,
  name,
  url,
  size = "default",
}: {
  seed: string;
  name: string;
  url?: string | null;
  size?: "default" | "sm" | "lg";
}) {
  const generated = useMemo(
    () =>
      new DiceBearAvatar(style, {
        seed,
        borderRadius: 50,
        size: 64,
      }).toDataUri(),
    [seed],
  );
  return (
    <Avatar size={size} className="inbox-dice-avatar">
      <AvatarImage src={url || generated} alt="" />
      <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
    </Avatar>
  );
}
