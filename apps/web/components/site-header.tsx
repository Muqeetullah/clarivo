"use client";
import { DashboardThemeToggle } from "@/components/dashboard-theme";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader() {
  const inbox = usePathname() === "/dashboard/inbox";
  return (
    <header className="workspace-header flex shrink-0 items-center gap-2 border-b px-4 lg:px-6">
      <SidebarTrigger aria-label="Toggle sidebar" />
      <Separator
        orientation="vertical"
        className="mx-2 h-4 data-vertical:self-auto"
      />
      <h1 className="text-sm font-medium">{inbox ? "Inbox" : "Home"}</h1>
      <Badge variant="secondary" className="ml-auto">
        Local preview
      </Badge>
      <DashboardThemeToggle />
    </header>
  );
}
