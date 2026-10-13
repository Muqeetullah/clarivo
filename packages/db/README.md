# Server-only auth identity read

`authUserExistsById(id): Promise<boolean>` confirms that a Neon Auth signup response references a persisted UUID. It returns no account details. Non-UUID synthetic IDs return false without opening a connection. This helper is internal to trusted auth response validation; do not expose it as an account lookup API.

The package uses Prisma 8's PostgreSQL runtime (`@prisma/orm-postgres`), which owns its pg connection pool. It initializes lazily and reuses one client per server process. Set server-side `DATABASE_URL` to the pooled URL for the same Neon branch as Neon Auth. Next.js loads `apps/web/.env.local` for local web execution. Missing configuration or database errors reject the operation so callers can fail closed.

Run `pnpm db:generate` from the repository root to emit the ignored `generated/` contract artifacts. This is offline and requires no credentials. Root dev, build, and typecheck commands generate first. Prisma 8 uses `prisma contract emit`, not the Prisma 7 generator/adapter APIs.

The contract is a partial read mapping of `neon_auth.user`, owned by Neon. It is **not a migration source**. Do not run schema updates, migrations, or database signing against this contract. There are intentionally no database mutation scripts or exported clients.
