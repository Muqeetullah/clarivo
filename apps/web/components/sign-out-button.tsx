"use client";
import { LoaderCircleIcon, LogOutIcon } from "lucide-react";
import { useSignOut } from "@/lib/auth/use-sign-out";
import { AuthButton } from "@/components/auth-ui";

export function SignOutButton({
  label = "Sign out",
  disabled = false,
}: {
  label?: string;
  disabled?: boolean;
}) {
  const { signOut, pending, error } = useSignOut();
  return (
    <div className="w-full">
      <AuthButton
        type="button"
        variant="outline"
        className="w-full"
        disabled={disabled || pending}
        aria-busy={pending}
        onClick={signOut}
      >
        {pending ? (
          <LoaderCircleIcon
            className="animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        ) : (
          <LogOutIcon aria-hidden="true" />
        )}
        {pending ? "Signing out…" : label}
      </AuthButton>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
