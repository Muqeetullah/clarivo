"use client";

import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  CheckCheck,
  ChevronRight,
  Code2,
  FileText,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { cn } from "@/lib/utils";
import { demoSources, type Conversation } from "@/lib/demo-data";

import type { Page } from "./types";
import { StateBadge, VisitorAvatar } from "./conversation-ui";
type Props = {
  page: Page;
  counts: { open: number; waiting: number; ai: number; closed: number };
  setFilter: (filter: string) => void;
  navigate: (page: Page) => void;
  conversations: Conversation[];
  filter: string;
  search: string;
  setSearch: (search: string) => void;
  filtered: Conversation[];
  setSelectedId: (id: string | null) => void;
  setReply: (reply: string) => void;
  readySources: number;
};
export function ConversationList({
  page,
  counts,
  setFilter,
  navigate,
  conversations,
  filter,
  search,
  setSearch,
  filtered,
  setSelectedId,
  setReply,
  readySources,
}: Props) {
  return (
    <>
      {page === "overview" && (
        <div className="stats-grid">
          {[
            {
              label: "Open conversations",
              value: counts.open,
              icon: MessageCircle,
              note: "A conversation is a connection",
              state: "open",
              className: "",
            },
            {
              label: "Agent handling",
              value: counts.ai,
              icon: Sparkles,
              note: "A little help from your agent",
              state: "ai",
              className: "purple",
            },
            {
              label: "Needs your attention",
              value: counts.waiting,
              icon: ArrowDownLeft,
              note: "Your human touch is needed",
              state: "waiting",
              className: "amber",
            },
            {
              label: "Closed conversations",
              value: counts.closed,
              icon: CheckCheck,
              note: "All wrapped up",
              state: "closed",
              className: "green",
            },
          ].map((stat) => (
            <button
              className={cn("stat-card", stat.className)}
              key={stat.label}
              onClick={() => {
                setFilter(stat.state);
                navigate("inbox");
              }}
            >
              <span className="stat-top">
                {stat.label}
                <stat.icon />
              </span>
              <span className="stat-value">
                {String(stat.value).padStart(2, "0")}
                <span className="stat-decoration" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              </span>
              <span className="stat-note">
                {stat.note}
                <ArrowUpRight />
              </span>
            </button>
          ))}
        </div>
      )}
      <div className={cn("content-grid", page === "inbox" && "inbox-only")}>
        <section className="conversation-panel" aria-label="Conversations">
          <div className="panel-heading">
            <div>
              <h2>
                {page === "overview"
                  ? "Recent conversations"
                  : "All conversations"}
                <span className="neutral-count">{conversations.length}</span>
              </h2>
              <p>You’re a good conversation away from a happy customer.</p>
            </div>
            {page === "overview" && (
              <button className="text-link" onClick={() => navigate("inbox")}>
                View all
                <ArrowRight />
              </button>
            )}
          </div>
          <div className="conversation-toolbar">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList variant="line">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="waiting">
                  Needs you <span>{counts.waiting}</span>
                </TabsTrigger>
                <TabsTrigger value="ai">Agent</TabsTrigger>
                <TabsTrigger value="human">Yours</TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="search-input">
              <Search />
              <Input
                aria-label="Search conversations"
                placeholder="Search conversations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="conversation-columns">
            <span>CONVERSATION</span>
            <span>STATUS</span>
            <span>LAST ACTIVE</span>
          </div>
          <div className="conversation-list">
            {filtered.length === 0 ? (
              <div className="empty-list">
                <Search />
                <h3>No conversations found</h3>
                <p>Try another search or filter.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              filtered.map((conversation) => (
                <button
                  className="conversation-row"
                  key={conversation.id}
                  onClick={() => {
                    setSelectedId(conversation.id);
                    setReply("");
                  }}
                >
                  <div className="conversation-person">
                    <VisitorAvatar conversation={conversation} />
                    <div>
                      <strong>{conversation.subject}</strong>
                      <span>
                        {conversation.visitor}
                        <span className="inline-dot">·</span>
                        {
                          conversation.messages
                            .filter((m) => m.author !== "system")
                            .at(-1)?.body
                        }
                      </span>
                    </div>
                  </div>
                  <StateBadge state={conversation.state} />
                  <span className="row-time">
                    {conversation.time}
                    <ChevronRight />
                  </span>
                </button>
              ))
            )}
          </div>
          <div className="list-footer">
            <span>
              <span className="status-dot" />
              {counts.waiting
                ? `${counts.waiting} ${counts.waiting === 1 ? "conversation is" : "conversations are"} waiting for you`
                : "You’re all caught up"}
            </span>
            <span>
              Showing {filtered.length} of {conversations.length}
            </span>
          </div>
        </section>
        {page === "overview" && (
          <aside className="overview-aside">
            <section className="agent-card">
              <div className="agent-card-top">
                <span>
                  <Sparkles />
                  Your support agent
                </span>
                <Badge variant="outline">Demo</Badge>
              </div>
              <div className="agent-art" aria-hidden="true">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <span className="art-star star-one">✦</span>
                <span className="art-star star-two">✧</span>
                <div className="agent-face">
                  <Bot />
                </div>
                <span className="agent-check">
                  <Check />
                </span>
              </div>
              <h2>
                Knowledge in.
                <br />
                Confidence out.
              </h2>
              <p>
                Your agent answers from your knowledge.
                <br />
                And knows when to bring you in.
              </p>
              <div className="agent-card-footer">
                <ShieldCheck />
                <span>Grounded in {readySources} ready sources</span>
              </div>
              <Button variant="outline" onClick={() => navigate("knowledge")}>
                Manage knowledge
                <ArrowRight data-icon="inline-end" />
              </Button>
            </section>
            <section className="knowledge-summary">
              <div className="section-heading">
                <h2>Your knowledge</h2>
                <span>{demoSources.length} sources</span>
              </div>
              {demoSources.slice(0, 3).map((source) => (
                <div className="mini-source" key={source.name}>
                  <span className="file-icon">
                    <FileText />
                  </span>
                  <div>
                    <strong>{source.name}</strong>
                    <span>
                      {source.type} <span className="inline-dot">·</span> Ready
                    </span>
                  </div>
                  <span className="ready-check">
                    <Check />
                  </span>
                </div>
              ))}
              <button
                className="text-link"
                onClick={() => navigate("knowledge")}
              >
                View knowledge base
                <ArrowRight />
              </button>
            </section>
          </aside>
        )}
      </div>
      {page === "overview" && (
        <section className="setup-banner">
          <span className="setup-icon">
            <Code2 />
          </span>
          <div>
            <h3>A small snippet. A warmer welcome.</h3>
            <p>Bring your support agent to your website in just a few steps.</p>
          </div>
          <div className="setup-steps">
            <span>
              <Check />
              Add knowledge
            </span>
            <span className="pending-step">
              <span>2</span>Customize widget
            </span>
            <span className="pending-step">
              <span>3</span>Install snippet
            </span>
          </div>
          <Button variant="outline" onClick={() => navigate("widget")}>
            Set up widget
            <ArrowRight data-icon="inline-end" />
          </Button>
        </section>
      )}
    </>
  );
}
