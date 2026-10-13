import { InboxIcon, LayoutDashboardIcon } from "lucide-react";
import Link from "next/link";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function WorkspacePlaceholder({ inbox = false }: { inbox?: boolean }) {
  const Icon = inbox ? InboxIcon : LayoutDashboardIcon;
  return (
    <Empty className="min-h-80 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>
          {inbox ? "Your inbox is not connected yet" : "Your account is ready"}
        </EmptyTitle>
        <EmptyDescription>
          {inbox
            ? "Visitor conversations and owner replies will live here. The inbox will be connected in a later step."
            : "You are signed in. Business setup is coming next. No workspace has been created yet."}
        </EmptyDescription>
        <Link
          className="text-sm text-primary underline underline-offset-4"
          href="/demo"
        >
          Explore the public dashboard demo
        </Link>
      </EmptyHeader>
    </Empty>
  );
}
