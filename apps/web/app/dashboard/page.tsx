import { WorkspacePlaceholder } from "@/components/workspace-placeholder";
import { requireVerifiedOwner } from "@/lib/auth/owner";
import { Suspense } from "react";
export default function DashboardPage() {
  return (
    <Suspense fallback={<p role="status">Loading your account…</p>}>
      <OwnerDashboard />
    </Suspense>
  );
}
async function OwnerDashboard() {
  await requireVerifiedOwner();
  return <WorkspacePlaceholder />;
}
