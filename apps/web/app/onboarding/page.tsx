import { Suspense } from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { workspaceForOwner } from "@clarivo/db/app";
import { requireVerifiedOwner } from "@/lib/auth/owner";
import { RpcProvider } from "@/lib/rpc/provider";
import { OnboardingForm } from "@/components/connected/onboarding";
import { AuthLoading } from "@/components/auth-loading";
export default function OnboardingPage() {
  return (
    <main className="auth-shell dark min-h-svh">
      <div className="auth-form-panel flex min-h-svh flex-col">
        <Link href="/" className="auth-brand flex w-fit items-center gap-3">
          <Image src="/assets/logo.svg" alt="" width={36} height={36} />
          <span className="text-xl font-semibold">clarivo</span>
        </Link>
        <div className="auth-form-body flex flex-1 items-center justify-center">
          <div className="auth-form-width w-full">
            <Suspense fallback={<AuthLoading />}>
              <Setup />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
async function Setup() {
  const owner = await requireVerifiedOwner();
  if (await workspaceForOwner(owner.id)) redirect("/dashboard");
  return (
    <RpcProvider key={owner.id}>
      <OnboardingForm />
    </RpcProvider>
  );
}
