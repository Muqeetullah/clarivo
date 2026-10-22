import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { workspaceForOwner } from "@clarivo/db/app";
import { requireVerifiedOwner } from "@/lib/auth/owner";
import { ConnectedSettings } from "@/components/connected/settings";
import { ownerApi } from "@/components/connected/server";
export default function DashboardPage() {
  return (
    <Suspense fallback={<p role="status">Loading your settings…</p>}>
      <OwnerDashboard />
    </Suspense>
  );
}
async function OwnerDashboard() {
  const owner = await requireVerifiedOwner();
  const workspace = await workspaceForOwner(owner.id);
  if (!workspace) redirect("/onboarding");
  const api = await ownerApi();
  const cache = new QueryClient();
  await cache.prefetchQuery(api.settings.get.queryOptions({ input: {} }));
  const appOrigin = new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ).origin;
  return (
    <HydrationBoundary state={dehydrate(cache)}>
      <ConnectedSettings workspaceId={workspace.id} appOrigin={appOrigin} />
    </HydrationBoundary>
  );
}
