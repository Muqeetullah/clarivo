import "server-only";
import { headers } from "next/headers";
import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { router } from "@/lib/rpc/router";

export async function ownerApi() {
  const incoming = new Headers(await headers());
  // Direct server calls retain the same request/session authorization as HTTP RPC.
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const request = new Request(new URL("/rpc", origin), { headers: incoming });
  return createTanstackQueryUtils(
    createRouterClient(router, { context: { request } }),
  );
}
