"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { useAuthNavigation } from "@/components/auth-navigation";

export function useSignOut() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const { navigate, navigating } = useAuthNavigation();
  async function signOut() {
    if (pending || navigating) return false;
    setPending(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError("Couldn’t sign out. Please try again.");
        return false;
      }
      navigate("/login", { replace: true, refreshSession: true });
      return true;
    } catch {
      setError("Couldn’t connect. Please try signing out again.");
      return false;
    } finally {
      setPending(false);
    }
  }
  return { signOut, pending: pending || navigating, error };
}
