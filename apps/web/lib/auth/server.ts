import "server-only";

import { createNeonAuth } from "@neondatabase/auth/next/server";

let auth: ReturnType<typeof createNeonAuth> | undefined;

export function getAuth() {
  if (auth) return auth;
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret || secret.length < 32) {
    throw new Error("Neon Auth environment is not configured.");
  }
  if (new URL(baseUrl).protocol !== "https:") {
    throw new Error("Neon Auth requires an HTTPS service URL.");
  }
  auth = createNeonAuth({ baseUrl, cookies: { secret } });
  return auth;
}
