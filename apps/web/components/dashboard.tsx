"use client";
import { ConversationList } from "./dashboard/conversation-list";
import { useConversations } from "./dashboard/use-conversations";

import { useState } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  CircleHelp,
  Inbox,
  MessageCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { demoSources } from "@/lib/demo-data";

const titles: Record<Page, string> = {
  overview: "Overview",
  inbox: "Inbox",
  knowledge: "Knowledge base",
  widget: "Chat widget",
};

import type { Page } from "./dashboard/types";

import { WidgetSettings } from "./dashboard/widget-settings";
import { KnowledgeSources } from "./dashboard/knowledge-sources";
import { ConversationDetail } from "./dashboard/conversation-detail";
import { DashboardNavigation } from "./dashboard/navigation";

export function Dashboard() {
  const {
    conversations,
    selected,
    setSelectedId,
    reply,
    setReply,
    changeState,
    sendReply,
  } = useConversations();
  const [page, setPage] = useState<Page>("overview");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const counts = {
    open: conversations.filter((c) => c.state !== "closed").length,
    waiting: conversations.filter((c) => c.state === "waiting").length,
    ai: conversations.filter((c) => c.state === "ai").length,
    closed: conversations.filter((c) => c.state === "closed").length,
  };
  const filtered = conversations
    .filter(
      (c) =>
        (filter === "all" ||
          (filter === "open" ? c.state !== "closed" : c.state === filter)) &&
        `${c.visitor} ${c.subject} ${c.messages.map((m) => m.body).join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort(
      (a, b) => Number(b.state === "waiting") - Number(a.state === "waiting"),
    );
  const readySources = demoSources.filter((s) => s.status === "ready").length;
  function navigate(next: Page) {
    setPage(next);
    setNotice("");
  }

  return (
    <div className="app-shell">
      <DashboardNavigation
        page={page}
        navigate={navigate}
        counts={counts}
        setNotice={setNotice}
      />

      <main className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <ChevronRight />
            <strong>{titles[page]}</strong>
          </div>
          <div className="topbar-right">
            <span className="demo-label">
              <span />
              Demo workspace
            </span>
            <span className="topbar-divider" />
            <span className="owner-avatar small">J</span>
          </div>
        </header>
        <div className="main-content">
          {notice && (
            <div className="notice" role="status">
              <CircleHelp />
              <p>{notice}</p>
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                <X />
              </button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR WORKSPACE, CONNECTED</div>
              <h1>
                {page === "overview" ? "Welcome back, Jan" : titles[page]}
                {page === "overview" && <span className="wave">✳</span>}
              </h1>
              <p>
                {page === "overview"
                  ? "A little overview of the conversations that matter."
                  : page === "inbox"
                    ? "Every conversation. The right help, at the right time."
                    : page === "knowledge"
                      ? "Give your agent the knowledge to give better answers."
                      : "Make visitors feel right at home."}
              </p>
            </div>
            {page === "overview" && (
              <Button variant="outline" onClick={() => navigate("inbox")}>
                <Inbox data-icon="inline-start" />
                Open inbox
                <ArrowUpRight data-icon="inline-end" />
              </Button>
            )}
          </div>

          {(page === "overview" || page === "inbox") && (
            <ConversationList
              page={page}
              counts={counts}
              setFilter={setFilter}
              navigate={navigate}
              conversations={conversations}
              filter={filter}
              search={search}
              setSearch={setSearch}
              filtered={filtered}
              setReply={setReply}
              setSelectedId={setSelectedId}
              readySources={readySources}
            />
          )}

          {page === "knowledge" && (
            <KnowledgeSources readySources={readySources} />
          )}

          <div hidden={page !== "widget"}>
            <WidgetSettings />
          </div>
          <footer className="page-footer">
            <span>
              <MessageCircle /> Thoughtful support starts here.
            </span>
            <span>Sample data · Changes reset on reload</span>
          </footer>
        </div>
      </main>

      <ConversationDetail
        selected={selected}
        setSelectedId={setSelectedId}
        changeState={changeState}
        reply={reply}
        setReply={setReply}
        sendReply={sendReply}
      />
    </div>
  );
}
