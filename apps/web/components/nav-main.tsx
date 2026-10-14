"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { InboxIcon, LayoutDashboardIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Home", url: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon },
];

export function NavMain() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarGroup className="sidebar-primary-nav">
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarGroupContent>
        <nav aria-label="Workspace navigation">
          <SidebarMenu>
            {items.map(({ title, url, icon: Icon }) => (
              <SidebarMenuItem key={url}>
                <SidebarMenuButton
                  render={<Link href={url} />}
                  isActive={pathname === url}
                  aria-current={pathname === url ? "page" : undefined}
                  tooltip={title}
                  aria-label={title}
                  onClick={() => setOpenMobile(false)}
                >
                  <Icon aria-hidden="true" />
                  <span className="group-data-[collapsible=icon]:hidden">
                    {title}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </nav>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
