"use client";
import type { OwnerProfile } from "@/lib/auth/owner-profile";

// Adapted from the official shadcn dashboard-01 block (Base Nova).
import Link from "next/link";
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
  const { setOpenMobile } = useSidebar();
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="py-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard" />}
              onClick={() => setOpenMobile(false)}
              aria-label="Clarivo workspace"
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
