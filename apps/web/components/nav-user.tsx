"use client";
import { useState } from "react";

import {
  EllipsisVerticalIcon,
  LoaderCircleIcon,
  LogOutIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSignOut } from "@/lib/auth/use-sign-out";
import type { OwnerProfile } from "@/lib/auth/owner-profile";
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

function OwnerAvatar({ owner }: { owner: OwnerProfile }) {
  const initials =
    owner.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() ||
    owner.email[0]?.toUpperCase() ||
    "C";
  return (
    <Avatar className="size-9 shrink-0">
      {owner.image && (
        <AvatarImage src={owner.image} alt="" referrerPolicy="no-referrer" />
      )}
      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export function NavUser({ owner }: { owner: OwnerProfile }) {
  const { isMobile } = useSidebar();
  const [open, setOpen] = useState(false);
  const { signOut, pending, error } = useSignOut();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="h-auto min-h-16 gap-3 rounded-xl p-3"
              />
            }
            aria-label="Open user profile menu"
          >
            <OwnerAvatar owner={owner} />
            <div className="grid min-w-0 flex-1 gap-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-medium" title={owner.name}>
                {owner.name}
              </span>
              <span
                className="truncate text-xs text-muted-foreground"
                title={owner.email}
              >
                {owner.email}
              </span>
            </div>
            <EllipsisVerticalIcon
              className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden"
              aria-hidden="true"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-72 max-w-[calc(100vw-2rem)] rounded-xl p-1.5"
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-3 p-3 font-normal">
                <OwnerAvatar owner={owner} />
                <span className="grid min-w-0 gap-1">
                  <span className="break-words text-sm font-medium text-foreground">
                    {owner.name}
                  </span>
                  <span className="break-all text-xs text-muted-foreground">
                    {owner.email}
                  </span>
                </span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              closeOnClick={false}
              disabled={pending}
              onClick={async () => {
                if (await signOut()) setOpen(false);
              }}
              className="min-h-10 cursor-pointer gap-3 rounded-lg px-3"
              aria-busy={pending}
            >
              {pending ? (
                <LoaderCircleIcon
                  className="animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : (
                <LogOutIcon aria-hidden="true" />
              )}
              {pending ? "Signing out…" : "Sign out"}
            </DropdownMenuItem>
            {error && (
              <p role="alert" className="px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
