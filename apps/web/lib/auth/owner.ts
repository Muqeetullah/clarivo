import { logAuthFailure } from "@/lib/auth/diagnostics";
import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getAuth } from "@/lib/auth/server";

// Request-local deduplication only. Never cache owner identity across requests.
const readOwnerSession = cache(async () => {
  // Keep SDK cookie reads out of Cache Components' prerender pass.
  await connection();
  const result = await (async () => {
    return getAuth().getSession({
      query: {
        // Pinned 0.6.0-beta checks for the serialized string before its local
        // cookie cache. A boolean only bypasses the upstream Better Auth cache.
        disableCookieCache: "true",
        // This guard reads identity only. Refresh belongs in the SDK proxy or
        // route handler, where writing response cookies is allowed.
        disableRefresh: true,
      },
    });
  })().catch((error: unknown) => {
    logAuthFailure("session", error);
    return null;
  });
  if (result?.error) logAuthFailure("session", result.error);
  return result;
});

export async function requireVerifiedOwner() {
  const result = await readOwnerSession();
  if (!result || result.error) redirect("/auth-error");
  const user = result.data?.user;
  if (!user) redirect("/login");
  if (!user.emailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email)}`);
  }
  // There is no workspace or membership in this slice. This grants identity only.
  return { id: user.id, name: user.name, email: user.email };
}

// Guest-only entry points must inspect the server session, not client state.
export async function redirectAuthenticatedOwner() {
  const result = await readOwnerSession();
  const user = result?.error ? undefined : result?.data?.user;
  if (!user) return;
  if (user.emailVerified) redirect("/dashboard");
  redirect(`/verify-email?email=${encodeURIComponent(user.email)}`);
}

export async function redirectVerifiedOwner() {
  const result = await readOwnerSession();
  if (!result?.error && result?.data?.user?.emailVerified)
    redirect("/dashboard");
}
