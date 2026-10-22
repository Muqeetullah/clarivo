"use client";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@clarivo/shared";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { Contract } from "@clarivo/shared";

export function createClient(token?: () => string | undefined) {
  return createORPCClient<ContractRouterClient<Contract>>(
    new RPCLink({
      url: "/rpc",
      origin: () => window.location.origin,
      headers: () => {
        const bearer = token?.();
        return bearer ? { Authorization: `Bearer ${bearer}` } : {};
      },
    }),
  );
}
export const rpc = createClient();
export const api = createTanstackQueryUtils(rpc);
