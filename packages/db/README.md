# Server-only persistence

`@clarivo/db` is internal server code. It never exports a database client. Tenant application operations are exported by `@clarivo/db/app`; the root exports `authUserExistsById` and an internal name/photo read used by the app layer after deriving the owner from workspace membership. Neither is a public account lookup endpoint.

## Two contracts with separate ownership

- `prisma.config.ts` → `prisma/contract.prisma` → ignored `generated/`: a partial **read-only mapping** of Neon-managed `neon_auth.user`, limited to `id`, `name`, and nullable `image` (confirmed by read-only development schema inspection). **Never migrate, sign, or run schema updates with this config.** Signup identity validation still selects only the ID; synthetic non-UUID IDs return false without opening a connection. Public widget identity reads derive the owner ID from that workspace's member and return only name/photo after the server checks the allowed host. Missing provider records use “Support team” and DiceBear. No email or auth ID is returned in widget configuration.
- `prisma.app.config.ts` → `prisma/app/contract.prisma` → ignored `generated-app/`: Clarivo-owned tables in the `clarivo` namespace, with their own migration lineage under `migrations/app/`. This contract contains no managed Auth models or foreign keys into `neon_auth`. Neon retains ownership of its schema.

Both use the installed Prisma 8 PostgreSQL runtime `8.0.0-rc.17` and CLI `8.0.0-rc.22`. Their exact API references ship in `node_modules/@prisma/orm-postgres/skills/prisma-8/`. This version uses `prisma contract emit`, typed `db.orm.clarivo` queries, and `db.transaction(async tx => ...)`; it does not use Prisma 7 generation or driver adapters.

Set server-side `DATABASE_URL` to the pooled URL for the **same Neon branch as Managed Auth**. Next.js loads `apps/web/.env.local`; CLI commands must load the environment explicitly. Credentials and bearer tokens must stay out of source control. Pools initialize lazily and reuse one instance per server process. Timestamps use Prisma's `TimestamptzString(3)` codec, normalized to UTC ISO strings at the package boundary, requiring no global Temporal polyfill.

## Generate and migrate

From the repository root:

```sh
pnpm db:generate
pnpm --filter @clarivo/db typecheck
```

Generation is offline and emits both contracts. Development/build/typecheck generate before consuming them.

Application migrations only, from `packages/db`:

```sh
# First baseline was deliberately planned from empty application state.
node node_modules/prisma/dist/prisma.js migration show --config prisma.app.config.ts 20261017T1402_live_chat_foundation

# REVIEW the destination branch before applying. This loads env without printing secrets.
node --env-file=../../apps/web/.env.local node_modules/prisma/dist/prisma.js db migrate --config prisma.app.config.ts --advance-ref db
```

The baseline is additive: creates `clarivo`, ensures `public` exists, creates seven application tables and their checks/indexes/foreign keys, and writes Prisma's application migration metadata. It does not alter or sign `neon_auth`. Only the confirmed Neon development branch may be changed under this milestone's authorization. Production requires separate authorization.

For later contract edits, emit, then plan **from the current app ref**, review, and apply:

```sh
node node_modules/prisma/dist/prisma.js contract emit --config prisma.app.config.ts
node node_modules/prisma/dist/prisma.js migration plan --config prisma.app.config.ts --name describe_change
node node_modules/prisma/dist/prisma.js migration show --config prisma.app.config.ts <migration-directory>
node --env-file=../../apps/web/.env.local node_modules/prisma/dist/prisma.js db migrate --config prisma.app.config.ts --advance-ref db
```

`migration plan` is offline and does not advance refs. The app `db` ref records the applied development contract. Do not create another baseline with `--from @empty`, edit generated `ops.json`, run `db update` against shared environments, or use the auth config for any of these commands. Migration TS and content-addressed contract snapshots are checked in; generated runtime artifacts are ignored.

## Trusted context and invariants

Call owner functions only after verifying the provider session and loading membership using `workspaceForOwner`. Call visitor functions only after verifying the signed workspace/visitor/host-bound token, matching its per-visitor secret hash, and checking the host remains allowed. Public workspace IDs are identifiers. `getPublicWorkspace` returns settings to the server so it can enforce domains/CSP and strip private fields before returning public widget config.

All tenant reads/writes filter by trusted workspace ID, plus the visitor/conversation/member ID where relevant. Composite foreign keys prevent tenant-mismatched conversation, message, member-author, and visit records. No raw IP or raw visitor bearer secret/token is stored.

- Onboarding atomically creates one workspace and separate owner member. Unique owner/user/workspace keys arbitrate retries and concurrent tabs; a losing transaction returns the committed winner. It seeds appearance only, with no visitors, conversations, messages, or knowledge.
- Appearance saves use an expected settings version. Avatar changes serialize on the same workspace row, preserve the old key until attachment commits, and advance that version. Pending uploads are workspace-bound, server-keyed, and expire; the storage service must validate/decode the object, publish validated bytes to a fresh key that was never presigned, then pass that final key to attachment. The presigned upload key itself cannot be attached, because its PUT URL remains reusable until expiration. A previously confirmed upload cannot reattach itself on retry.
- A visit is a top-level page lifecycle UUID supplied by the embed loader and reused across iframe renders, reconnects, and repeated metadata calls. A durable unique visit record ensures those repetitions count once. A reload/new page lifecycle counts another visit; opening a widget alone creates no conversation.
- One partial unique index permits at most one non-closed conversation for each workspace/visitor. Sends, replies, close, takeover, and inactivity closure take the visitor row lock first and conversation row lock second. `FOR NO KEY UPDATE` allows foreign-key checks without weakening serialization.
- A first send stores the greeting, visitor message, and waiting explanation atomically, starting in `waiting` / `agent_off`. Retry UUIDs are unique per workspace and must match body/author/conversation. A retry after closure returns the original message; a new UUID after closure starts a new conversation.
- Owner replies atomically take over to `human`. Closed conversations reject new replies. Consecutive message timestamps are strictly increasing inside a conversation, preserving order even under rapid sends.
- The scheduler-only `autoCloseConversations` scans open conversations idle for 24 hours, then rechecks inactivity under the same locks used by sends. It persists the close notice and state atomically and returns workspace IDs for server event publication. The caller must authenticate the scheduler. This module creates no schedule itself.

Persisted results must be published only **after** these functions return (transaction commit). A publish failure must not fail or roll back a committed action. `AppDataError` exposes `NOT_FOUND`, `CONFLICT`, `FORBIDDEN`, and `INVALID_INPUT` for the API boundary to map to typed errors.
