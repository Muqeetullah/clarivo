import "server-only";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "./generated-app/contract.d";
import contractJson from "./generated-app/contract.json" with { type: "json" };
function createAppClient() {
  const url = process.env.DATABASE_URL;
  if (!url)
    throw new Error("DATABASE_URL is required for Clarivo persistence.");
  return postgres<Contract>({
    url,
    contractJson,
    poolOptions: { connectionTimeoutMillis: 10_000, idleTimeoutMillis: 30_000 },
  });
}
const shared = globalThis as typeof globalThis & {
  clarivoAppClient?: ReturnType<typeof createAppClient>;
};
export function appClient() {
  return (shared.clarivoAppClient ??= createAppClient());
}
export type AppTransaction = Parameters<
  Parameters<ReturnType<typeof createAppClient>["transaction"]>[0]
>[0];
