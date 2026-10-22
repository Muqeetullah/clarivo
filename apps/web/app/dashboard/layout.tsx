import { WorkspaceLoading } from "@/components/auth-loading";
import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireVerifiedOwner } from "@/lib/auth/owner";
import { workspaceForOwner } from "@clarivo/db/app";
import { redirect } from "next/navigation";
import { RpcProvider } from "@/lib/rpc/provider";
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
  if (!(await workspaceForOwner(owner.id))) redirect("/onboarding");
  return (
    <RpcProvider key={owner.id}>
      <DashboardShell key={owner.id} owner={owner}>
        {children}
      </DashboardShell>
    </RpcProvider>
  );
}
