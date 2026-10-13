"use client";
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function DashboardShell({
  children,
  owner,
}: {
  children: ReactNode;
  owner: { name: string; email: string };
}) {
  return (
    <TooltipProvider>
      <SidebarProvider className="workspace-shell">
        <a href="#workspace-content" className="workspace-skip">
          Skip to content
        </a>
        <AppSidebar owner={owner} />
        <SidebarInset className="min-w-0">
          <SiteHeader />
          <div
            id="workspace-content"
            tabIndex={-1}
            className="flex flex-1 flex-col p-4 md:p-6"
          >
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
