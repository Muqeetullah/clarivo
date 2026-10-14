"use client";

import { useState } from "react";
import { Inbox, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { InboxAvatar, visitorLabel } from "./inbox-avatar";
import { InboxChat } from "./inbox-chat";
import { StateBadge } from "./conversation-ui";
import { useConversations } from "./use-conversations";

const filters = ["all", "waiting", "ai", "human", "closed"] as const;
export function DashboardInbox() {
  const state = useConversations("1042");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const conversations = state.conversations
    .filter(
      (c) =>
        (filter === "all" ? c.state !== "closed" : c.state === filter) &&
        `${c.visitor} ${visitorLabel(c)} ${c.subject} ${c.messages.map((m) => m.body).join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort(
      (a, b) => Number(b.state === "waiting") - Number(a.state === "waiting"),
    );
  return (
    <section
      aria-label="Support inbox"
      className={cn(
        "dashboard-inbox inbox-reference",
        state.selected && "has-selection",
      )}
    >
      <section className="inbox-list-panel" aria-label="Conversations">
        <header className="inbox-list-heading">
          <div>
            <h2>Inbox</h2>
            <Badge variant="secondary">
              {state.conversations.filter((c) => c.state === "waiting").length}{" "}
              waiting
            </Badge>
          </div>
          <div
            className="inbox-filters"
            role="group"
            aria-label="Filter conversations"
          >
            {filters.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {
                  {
                    all: "All open",
                    waiting: "Waiting",
                    ai: "Agent",
                    human: "You",
                    closed: "Closed",
                  }[value]
                }
                <span>
                  {
                    state.conversations.filter((c) =>
                      value === "all"
                        ? c.state !== "closed"
                        : c.state === value,
                    ).length
                  }
                </span>
              </button>
            ))}
          </div>
          <label className="inbox-search">
            <Search aria-hidden="true" />
            <span className="sr-only">Search conversations</span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
            />
          </label>
        </header>
        <div className="inbox-conversations">
          {conversations.map((c) => (
            <button
              type="button"
              className="inbox-conversation"
              key={c.id}
              aria-current={state.selected?.id === c.id ? "true" : undefined}
              onClick={() => {
                state.setSelectedId(c.id);
                state.setReply("");
              }}
            >
              <InboxAvatar seed={c.id} label={visitorLabel(c)} />
              <div className="inbox-row-content">
                <div className="inbox-row-top">
                  <strong>{visitorLabel(c)}</strong>
                  <time>{c.time}</time>
                </div>
                <p>{c.messages.findLast((m) => m.author !== "system")?.body}</p>
                <div className="inbox-row-status">
                  <StateBadge state={c.state} compact />
                  {c.state === "waiting" && c.reason && <span>{c.reason}</span>}
                </div>
              </div>
            </button>
          ))}
          {!conversations.length && (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No conversations found</EmptyTitle>
                <EmptyDescription>
                  Try another search or conversation state.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
        <footer className="inbox-list-footer">
          Sample conversations · Nothing is sent to visitors
        </footer>
      </section>
      {state.selected ? (
        <InboxChat {...state} />
      ) : (
        <Empty className="inbox-unselected">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>A space for thoughtful support</EmptyTitle>
            <EmptyDescription>
              Select a conversation to read the history and help your visitor.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </section>
  );
}
