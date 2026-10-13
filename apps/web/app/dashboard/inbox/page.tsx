import { WorkspacePlaceholder } from "@/components/workspace-placeholder";
import { requireVerifiedOwner } from "@/lib/auth/owner";
import { Suspense } from "react";
export default function InboxPage() {
  return (
    <Suspense fallback={<p role="status">Loading your account…</p>}>
      <OwnerInbox />
    </Suspense>
  );
}
async function OwnerInbox() {
  await requireVerifiedOwner();
  return <WorkspacePlaceholder inbox />;
}
