"use client";

import {
  ArrowUpRight,
  BookOpen,
  CircleHelp,
  Inbox,
  LayoutDashboard,
  MessageCircle,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

import type { Page } from "./types";
const navigation = [
  { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
  { id: "inbox" as const, label: "Inbox", icon: Inbox },
  { id: "knowledge" as const, label: "Knowledge base", icon: BookOpen },
  { id: "widget" as const, label: "Chat widget", icon: MessageCircle },
];
export function DashboardNavigation({
  page,
  navigate,
  counts,
  setNotice,
}: {
  page: Page;
  navigate: (page: Page) => void;
  counts: { waiting: number };
  setNotice: (notice: string) => void;
}) {
  return (
    <aside className="app-sidebar">
      <a
        href="#overview"
        className="brand"
        onClick={(e) => {
          e.preventDefault();
          navigate("overview");
        }}
      >
        <span className="brand-mark">
          <MessageCircle strokeWidth={2.3} />
        </span>
        clarivo<span className="brand-period">.</span>
      </a>
      <div className="workspace">
        <span className="workspace-mark">C</span>
        <div>
          <strong>Clarivo workspace</strong>
          <span>Your support space</span>
        </div>
        <Badge variant="secondary">v1</Badge>
      </div>
      <div className="nav-label">WORKSPACE</div>
      <nav aria-label="Main navigation">
        {navigation.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className={cn("nav-item", page === item.id && "active")}
            aria-current={page === item.id ? "page" : undefined}
          >
            <item.icon />
            <span>{item.label}</span>
            {item.id === "inbox" && counts.waiting > 0 && (
              <span className="nav-count">{counts.waiting}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <span className="small-spark">
            <Sparkles />
          </span>
          <strong>
            A helpful agent.
            <br />A human touch.
          </strong>
          <p>
            Great support starts with
            <br />
            what you know.
          </p>
          <button onClick={() => navigate("knowledge")}>
            Explore your knowledge <ArrowUpRight />
          </button>
        </div>
        <button
          className="nav-item"
          onClick={() =>
            setNotice(
              "This demo runs locally. Explore the inbox, send a reply, or preview your chat widget. Changes reset when you reload.",
            )
          }
        >
          <CircleHelp />
          <span>Help & getting started</span>
          <ArrowUpRight />
        </button>
        <button
          className="owner"
          onClick={() =>
            setNotice(
              "You’re viewing the demo as Jan, the workspace owner. Account settings will be connected with Neon Auth in the next milestone.",
            )
          }
        >
          <span className="owner-avatar">J</span>
          <span>
            <strong>Muqeet ullah</strong>
            <small>Workspace owner</small>
          </span>
          <MoreHorizontal />
        </button>
      </div>
    </aside>
  );
}
