import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { workspaceForOwner } from "@clarivo/db/app";
import { requireVerifiedOwner } from "@/lib/auth/owner";
import { ownerApi } from "@/components/connected/server";
import { ConnectedInbox } from "@/components/connected/inbox";
export default function InboxPage() {
  return (
    <Suspense fallback={<p role="status">Loading your inbox…</p>}>
      <OwnerInbox />
    </Suspense>
  );
}
async function OwnerInbox() {
  const owner = await requireVerifiedOwner();
  const workspace = await workspaceForOwner(owner.id);
  if (!workspace) redirect("/onboarding");
  const api = await ownerApi();
  const cache = new QueryClient();
  await cache.prefetchInfiniteQuery(
    api.inbox.list.infiniteOptions({
      input: (cursor: string | undefined) => ({
        openOnly: true,
        limit: 50,
        ...(cursor ? { cursor } : {}),
      }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (page) => page.nextCursor || undefined,
    }),
  );
  return (
    <HydrationBoundary state={dehydrate(cache)}>
      <ConnectedInbox workspaceId={workspace.id} />
    </HydrationBoundary>
  );
}
