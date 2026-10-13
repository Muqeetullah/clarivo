import { WorkspaceLoading } from "@/components/auth-loading";
import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireVerifiedOwner } from "@/lib/auth/owner";
export const metadata: Metadata = { title: "Workspace — Clarivo" };
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<WorkspaceLoading />}>
      <ProtectedDashboard>{children}</ProtectedDashboard>
    </Suspense>
  );
}

async function ProtectedDashboard({ children }: { children: ReactNode }) {
  const owner = await requireVerifiedOwner();
  return (
    <DashboardShell key={owner.id} owner={owner}>
      {children}
    </DashboardShell>
  );
}
