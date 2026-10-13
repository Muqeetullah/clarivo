"use client";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader() {
  const inbox = usePathname() === "/dashboard/inbox";
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 lg:px-6">
      <SidebarTrigger aria-label="Toggle sidebar" />
      <Separator
        orientation="vertical"
        className="mx-2 h-4 data-vertical:self-auto"
      />
      <h1 className="text-sm font-medium">{inbox ? "Inbox" : "Dashboard"}</h1>
      <Badge variant="secondary" className="ml-auto">
        UI preview
      </Badge>
    </header>
  );
}
