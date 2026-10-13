"use client";

import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";
import {
  stateLabels,
  type Conversation,
  type ConversationState,
} from "@/lib/demo-data";

export function StateBadge({ state }: { state: ConversationState }) {
  return (
    <Badge variant="outline" className={cn("state-badge", `state-${state}`)}>
      <span className="status-dot" />
      {stateLabels[state]}
    </Badge>
  );
}
export function VisitorAvatar({
  conversation,
}: {
  conversation: Conversation;
}) {
  return (
    <span
      className={cn("visitor-avatar", conversation.color)}
      aria-hidden="true"
    >
      {conversation.initials}
    </span>
  );
}
