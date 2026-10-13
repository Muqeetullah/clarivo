import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailForm } from "@/components/verify-email-form";
import { redirectVerifiedOwner } from "@/lib/auth/owner";
export const metadata: Metadata = { title: "Verify email — Clarivo" };
type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
async function VerificationQuery({ searchParams }: Props) {
  await redirectVerifiedOwner();
  const query = await searchParams;
  return (
    <VerifyEmailForm
      email={typeof query.email === "string" ? query.email : ""}
      sent={query.sent === "1"}
    />
  );
}
export default function VerifyEmailPage(props: Props) {
  return (
    <Suspense fallback={null}>
      <VerificationQuery {...props} />
    </Suspense>
  );
}
