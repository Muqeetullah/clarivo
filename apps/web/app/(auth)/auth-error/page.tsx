import type { Metadata } from "next";
import { AuthLink } from "@/components/auth-navigation";
import { AuthCard, AuthButton, AuthFeedback } from "@/components/auth-ui";
export const metadata: Metadata = { title: "Sign-in interrupted — Clarivo" };
export default function AuthErrorPage() {
  return (
    <AuthCard
      title="Let’s try signing in again"
      description="Return to log in and try email and password or Google."
      footer={
        <AuthLink href="/signup" className="auth-switch-link">
          Create an account
        </AuthLink>
      }
    >
      <div className="auth-form">
        <AuthFeedback
          error
          title="Sign-in interrupted"
          message="Your sign-in link may have expired or already been used, or sign-in was cancelled. The sign-in service may also be temporarily unavailable."
        />
        <AuthButton render={<AuthLink href="/login" />} nativeButton={false}>
          Back to log in
        </AuthButton>
      </div>
    </AuthCard>
  );
}
