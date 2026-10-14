"use client";
import type { OwnerProfile } from "@/lib/auth/owner-profile";
import type { CSSProperties, ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useDashboardThemeClass } from "@/components/dashboard-theme";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

export function DashboardShell({
  children,
  owner,
}: {
  children: ReactNode;
  owner: OwnerProfile;
}) {
  const themeClass = useDashboardThemeClass();
  return (
    <TooltipProvider>
      <SidebarProvider
        className={cn("workspace-shell", themeClass)}
        style={{ "--sidebar-width-icon": "4rem" } as CSSProperties}
      >
        <a href="#workspace-content" className="workspace-skip">
          Skip to content
        </a>
        <AppSidebar owner={owner} />
        <SidebarInset className="workspace-surface min-w-0">
          <SiteHeader />
          <div
            id="workspace-content"
            tabIndex={-1}
            className="workspace-content flex flex-1 flex-col"
          >
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
