"use client";

import { useState } from "react";
import { useAuthNavigation } from "@/components/auth-navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAuthApiError, isAuthError } from "@neondatabase/auth/next";
import { authClient } from "@/lib/auth/client";
import { AuthCard, AuthButton, AuthFeedback } from "@/components/auth-ui";
import { useAuthReady } from "@/lib/auth/use-auth-ready";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
function verificationErrorMessage(status?: number) {
  return status === 429 || (status !== undefined && status >= 500)
    ? "Verification is temporarily unavailable. Please wait a moment and try again."
    : "That code is invalid or expired. Check the code or request a new one.";
}

const schema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your email."),
});
export function VerifyEmailForm({
  email = "",
  sent = false,
}: {
  email?: string;
  sent?: boolean;
}) {
  const hydrated = useAuthReady();
  const { navigate, navigating } = useAuthNavigation();
  const [messageIsError, setMessageIsError] = useState(false);
  const [pending, setPending] = useState(false);
  const [action, setAction] = useState<"verify" | "resend">("verify");
  const [message, setMessage] = useState(
    sent
      ? "Your code is on its way. Check your inbox and spam folder."
      : "Request a code below, then enter it to verify your email.",
  );
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { otp: "" },
  });
  const validEmail = z.email().safeParse(email.trim()).success;
  async function verify(values: z.infer<typeof schema>) {
    if (pending || !validEmail || navigating) return;
    setAction("verify");
    setPending(true);
    setMessage("");
    setMessageIsError(true);
    try {
      const result = await authClient.emailOtp.verifyEmail({
        ...values,
        email: email.trim(),
      });
      if (result.error)
        setMessage(verificationErrorMessage(result.error.status));
      else {
        navigate("/dashboard", { replace: true, refreshSession: true });
      }
    } catch (error) {
      setMessage(
        isAuthError(error)
          ? verificationErrorMessage(error.status)
          : "We couldn’t connect. Check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }
  async function resend() {
    if (pending || !validEmail || navigating) return;
    setAction("resend");
    setPending(true);
    setMessage("");
    setMessageIsError(true);
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "email-verification",
      });
      setMessageIsError(!!result.error);
      setMessage(
        result.error
          ? "We couldn’t send a code. Please wait a moment and try again."
          : "If this email needs verification, a new code is on its way. Use the latest code.",
      );
    } catch (error) {
      setMessage(
        isAuthApiError(error)
          ? "We couldn’t send a code. Please wait a moment and try again."
          : "We couldn’t connect. Check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <AuthCard
      title="Verify your email"
      description={
        validEmail ? (
          <>
            Enter the 6-digit code sent to{" "}
            <span className="auth-verification-email">{email}</span>.
          </>
        ) : (
          "Return to log in to choose the account you want to verify."
        )
      }
      footer={
        <SignOutButton
          label="Use a different account"
          disabled={pending || navigating}
        />
      }
    >
      {validEmail ? (
        <form
          method="post"
          noValidate
          onSubmit={form.handleSubmit(verify)}
          aria-busy={pending}
          aria-describedby={message ? "verification-feedback" : undefined}
          className="auth-form"
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="otp"
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  data-disabled={!hydrated || pending || navigating}
                >
                  <FieldLabel htmlFor="otp">Verification code</FieldLabel>
                  <InputOTP
                    {...field}
                    id="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS}
                    pasteTransformer={(value) => value.replace(/[^0-9]/g, "")}
                    disabled={!hydrated || pending || navigating}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={
                      fieldState.error ? "otp-error" : undefined
                    }
                    containerClassName="auth-otp"
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }, (_, index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          aria-invalid={fieldState.invalid}
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  {fieldState.error && (
                    <FieldDescription id="otp-error">
                      {fieldState.error.message}
                    </FieldDescription>
                  )}
                </Field>
              )}
            />
            <AuthFeedback
              id="verification-feedback"
              message={message}
              error={messageIsError}
              title={
                messageIsError ? "Unable to verify email" : "Email verification"
              }
            />
            <AuthButton
              type="submit"
              loading={(pending && action === "verify") || navigating}
              disabled={!hydrated || pending || navigating}
            >
              {pending && action === "verify" ? "Verifying…" : "Verify email"}
            </AuthButton>
            <AuthButton
              type="button"
              variant="outline"
              disabled={!hydrated || pending || navigating}
              onClick={resend}
              loading={pending && action === "resend"}
            >
              {pending && action === "resend"
                ? "Sending code…"
                : "Send a new code"}
            </AuthButton>
          </FieldGroup>
          <noscript>
            <p className="text-sm text-muted-foreground">
              Enable JavaScript to securely verify your email.
            </p>
          </noscript>
        </form>
      ) : (
        <AuthFeedback
          error
          title="Email address required"
          message="Your email address is missing or invalid. Log in again to request a verification code."
        />
      )}
    </AuthCard>
  );
}
