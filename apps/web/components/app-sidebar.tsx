"use client";
import type { OwnerProfile } from "@/lib/auth/owner-profile";

// Adapted from the official shadcn dashboard-01 block (Base Nova).
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDashboardThemeClass } from "@/components/dashboard-theme";
import { Brand } from "@/components/brand";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar({ owner }: { owner: OwnerProfile }) {
  const themeClass = useDashboardThemeClass();
  const { setOpenMobile } = useSidebar();
  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className={cn(themeClass, "clarivo-sidebar")}
    >
      <SidebarHeader className="py-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard" />}
              onClick={() => setOpenMobile(false)}
              aria-label="Clarivo workspace"
              className="sidebar-brand-button"
            >
              <Brand compact />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter className="pb-4">
        <NavUser owner={owner} />
      </SidebarFooter>
    </Sidebar>
  );
}
