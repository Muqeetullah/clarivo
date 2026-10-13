"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
export function SignOutButton({ label = "Sign out" }: { label?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    setPending(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) setError("Couldn’t sign out. Please try again.");
      else window.location.replace("/login");
    } catch {
      setError("Couldn’t connect. Please try signing out again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div>
      <Button variant="outline" size="sm" disabled={pending} onClick={signOut}>
        {pending ? "Signing out…" : label}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
