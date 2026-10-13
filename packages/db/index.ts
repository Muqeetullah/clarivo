import "server-only";

import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "./generated/contract.d";
import contractJson from "./generated/contract.json" with { type: "json" };

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url)
    throw new Error("DATABASE_URL is required for auth identity verification.");
  return postgres<Contract>({
    url,
    contractJson,
    poolOptions: { connectionTimeoutMillis: 10_000, idleTimeoutMillis: 30_000 },
  });
}

const shared = globalThis as typeof globalThis & {
  clarivoAuthReadClient?: ReturnType<typeof createClient>;
};

// Internal auth response validation only, never a public account lookup endpoint.
// Only the boolean leaves this layer; no client or managed user record is exported.
export async function authUserExistsById(id: string): Promise<boolean> {
  // Neon IDs are UUIDs; synthetic anti-enumeration responses can use other IDs.
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    return false;
  const db = (shared.clarivoAuthReadClient ??= createClient());
  const user = await db.orm.neon_auth.AuthUser.where((user) =>
    user.id.eq(id),
  ).first();
  return user !== null;
}
