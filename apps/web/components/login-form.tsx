"use client";
import { useLoginForm } from "@/lib/auth/use-login-form";

import { AuthLink } from "@/components/auth-navigation";
import { EyeIcon, EyeOffIcon, LoaderCircleIcon, MailIcon } from "lucide-react";
import { AuthCard, AuthButton, AuthFeedback } from "@/components/auth-ui";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";

export function LoginForm({ signup = false }: { signup?: boolean }) {
  const {
    hydrated,
    pending,
    googlePending,
    message,
    messageIsError,
    verificationEmail,
    magic,
    showPassword,
    setShowPassword,
    form,
    submit,
    google,
    magicLink,
    toggleMethod,
  } = useLoginForm(signup);

  return (
    <AuthCard
      title={
        signup
          ? "Create your account"
          : magic
            ? "Log in with an email link"
            : "Welcome back"
      }
      description={
        signup
          ? "Bring your conversations together with Clarivo."
          : magic
            ? "Email link sign-in is awaiting setup. Use your password or Google for now."
            : "Sign in to your Clarivo account."
      }
      footer={
        <p className="text-center text-sm text-muted-foreground">
          {signup ? "Already have an account? " : "Don’t have an account? "}
          <AuthLink
            disabled={pending}
            className="auth-switch-link"
            href={signup ? "/login" : "/signup"}
          >
            {signup ? "Log in" : "Sign up"}
          </AuthLink>
        </p>
      }
    >
      <form
        method="post"
        noValidate
        onSubmit={
          magic
            ? (event) => {
                event.preventDefault();
                void magicLink();
              }
            : form.handleSubmit(submit)
        }
        aria-busy={pending}
        aria-describedby={message ? "auth-feedback" : undefined}
        className="auth-form"
      >
        <FieldGroup>
          {signup && (
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input
                id="name"
                autoComplete="name"
                placeholder="Your name"
                disabled={!hydrated || pending}
                aria-invalid={!!form.formState.errors.name}
                aria-describedby={
                  form.formState.errors.name ? "name-error" : undefined
                }
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <FieldDescription id="name-error">
                  {form.formState.errors.name.message}
                </FieldDescription>
              )}
            </Field>
          )}
          <Field data-invalid={!!form.formState.errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@company.com"
              disabled={!hydrated || pending}
              aria-invalid={!!form.formState.errors.email}
              aria-describedby={
                form.formState.errors.email ? "email-error" : undefined
              }
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <FieldDescription id="email-error">
                {form.formState.errors.email.message}
              </FieldDescription>
            )}
          </Field>
          {!magic && (
            <Field data-invalid={!!form.formState.errors.password}>
              <FieldLabel htmlFor="password">
                {signup ? "Create a password" : "Password"}
              </FieldLabel>
              <InputGroup className="auth-control">
                <InputGroupInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={signup ? "new-password" : "current-password"}
                  placeholder="Enter your password"
                  disabled={!hydrated || pending}
                  aria-invalid={!!form.formState.errors.password}
                  aria-describedby="password-help"
                  {...form.register("password")}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={!hydrated || pending}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-controls="password"
                  >
                    {showPassword ? (
                      <EyeOffIcon aria-hidden="true" />
                    ) : (
                      <EyeIcon aria-hidden="true" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription id="password-help">
                {form.formState.errors.password?.message ||
                  (signup ? "Use between 8 and 128 characters." : "")}
              </FieldDescription>
            </Field>
          )}
          {message && (
            <AuthFeedback
              id="auth-feedback"
              message={message}
              error={messageIsError}
              title={
                messageIsError
                  ? verificationEmail
                    ? "Email verification required"
                    : signup
                      ? "Unable to create account"
                      : "Unable to sign in"
                  : "Check your email"
              }
            >
              {verificationEmail && (
                <AuthLink
                  className="mt-2 block"
                  href={`/verify-email?email=${encodeURIComponent(verificationEmail)}`}
                >
                  Verify email / request a new code
                </AuthLink>
              )}
            </AuthFeedback>
          )}
          <AuthButton
            type="submit"
            loading={pending && !googlePending}
            disabled={!hydrated || pending}
          >
            {pending && !googlePending
              ? signup
                ? "Creating account…"
                : magic
                  ? "Sending link…"
                  : "Signing in…"
              : signup
                ? "Create account"
                : magic
                  ? "Send sign-in link"
                  : "Log in"}
          </AuthButton>
          <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
            Or continue with
          </FieldSeparator>
          <AuthButton
            type="button"
            variant="outline"
            disabled={!hydrated || pending}
            onClick={google}
            aria-busy={googlePending}
          >
            {googlePending ? (
              <LoaderCircleIcon
                aria-hidden="true"
                data-icon="inline-start"
                className="animate-spin motion-reduce:animate-none"
              />
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                data-icon="inline-start"
              >
                <path
                  fill="#4285F4"
                  d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-1.99 3.01v2.5h3.22c1.89-1.74 2.99-4.3 2.99-7.34Z"
                />
                <path
                  fill="#34A853"
                  d="M12 22c2.7 0 4.96-.9 6.61-2.43l-3.22-2.5c-.9.6-2.05.97-3.39.97-2.6 0-4.8-1.76-5.59-4.12H3.09v2.58A10 10 0 0 0 12 22Z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.41 13.92a6 6 0 0 1 0-3.84V7.5H3.09a10 10 0 0 0 0 9l3.32-2.58Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.96c1.47 0 2.78.5 3.82 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.91 5.5l3.32 2.58A5.99 5.99 0 0 1 12 5.96Z"
                />
              </svg>
            )}
            {googlePending ? "Connecting to Google…" : "Continue with Google"}
          </AuthButton>
          {googlePending && (
            <p role="status" className="sr-only">
              Opening Google account selection…
            </p>
          )}
          {!signup && (
            <AuthButton
              type="button"
              variant="outline"
              disabled={!hydrated || pending}
              onClick={toggleMethod}
              aria-pressed={magic}
            >
              <MailIcon data-icon="inline-start" aria-hidden="true" />
              {magic ? "Use email and password" : "Email me a sign-in link"}
            </AuthButton>
          )}
        </FieldGroup>
        <noscript>
          <p className="text-sm text-muted-foreground">
            Enable JavaScript to securely sign in or verify your email.
          </p>
        </noscript>
      </form>
    </AuthCard>
  );
}
