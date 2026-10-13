import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";
import { redirectAuthenticatedOwner } from "@/lib/auth/owner";
export const metadata: Metadata = { title: "Log in — Clarivo" };
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <GuestLogin />
    </Suspense>
  );
}

async function GuestLogin() {
  await redirectAuthenticatedOwner();
  return <LoginForm />;
}
