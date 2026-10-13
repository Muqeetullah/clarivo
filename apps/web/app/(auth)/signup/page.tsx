import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";
import { redirectAuthenticatedOwner } from "@/lib/auth/owner";
export const metadata: Metadata = { title: "Sign up — Clarivo" };
export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <GuestSignup />
    </Suspense>
  );
}

async function GuestSignup() {
  await redirectAuthenticatedOwner();
  return <LoginForm signup />;
}
