"use client";

import Link from "next/link";
import { EllipsisVerticalIcon, HouseIcon, UserRoundIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SignOutButton } from "@/components/sign-out-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// The dashboard-01 profile menu, with only actions supported by this UI preview.
export function NavUser({ owner }: { owner: { name: string; email: string } }) {
  const { isMobile } = useSidebar();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" />}
            aria-label="Open user profile menu"
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg">
                <UserRoundIcon aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium">{owner.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {owner.email}
              </span>
            </div>
            <EllipsisVerticalIcon
              className="ml-auto group-data-[collapsible=icon]:hidden"
              aria-hidden="true"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>{owner.name}</DropdownMenuLabel>
              <DropdownMenuItem disabled>
                <UserRoundIcon />
                Account · coming later
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/" />}>
                <HouseIcon />
                Back to homepage
              </DropdownMenuItem>
              <div className="p-2">
                <SignOutButton />
              </div>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
