# Clarivo realtime delivery

The Worker uses `partyserver@0.5.10`, with two hibernating SQLite Durable Object classes. It delivers already-persisted database events and ephemeral typing; it does not write application data or implement an AI agent. The web app uses `partysocket@1.3.0`.

Official references: [PartyServer](https://github.com/cloudflare/partykit/tree/main/packages/partyserver), [PartySocket](https://github.com/cloudflare/partykit/tree/main/packages/partysocket), and [Workers constant-time secret comparison](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/#timingsafeequal). Installed package declarations were checked against these APIs.

## Local setup

From the repository root:

```sh
pnpm install
cp apps/realtime/.dev.vars.example apps/realtime/.dev.vars.development
pnpm --filter @clarivo/realtime dev
```

Put two independently generated secrets of at least 32 bytes in the ignored `.dev.vars.development` file: `REALTIME_TOKEN_SECRET` and `REALTIME_PUBLISH_SECRET`. Use the identical corresponding values in `apps/web/.env.local`; neither may equal `VISITOR_TOKEN_SECRET`. Configure the web app:

```dotenv
REALTIME_URL=http://localhost:1999
NEXT_PUBLIC_REALTIME_HOST=localhost:1999
```

`REALTIME_URL` is the server publishing origin; `NEXT_PUBLIC_REALTIME_HOST` is public and contains only the socket host (with optional port). Production web runtime requires HTTPS for publication. `/health` reports the service identity and whether the Worker secrets are configured, without exposing them. Restart Next.js after changing the public host.

## Development deployment

With an authorized Cloudflare account, set the two Worker secrets interactively, then deploy:

```sh
pnpm --filter @clarivo/realtime exec wrangler secret put REALTIME_TOKEN_SECRET --env development
pnpm --filter @clarivo/realtime exec wrangler secret put REALTIME_PUBLISH_SECRET --env development
pnpm --filter @clarivo/realtime deploy:dev
```

The `development` environment creates only `clarivo-realtime-dev`, with `Workspace` and `Conversation` bindings and the `v1` SQLite Durable Object migration. No production bindings or production deployment command are configured. Set the development web app's `REALTIME_URL` to the returned HTTPS origin and `NEXT_PUBLIC_REALTIME_HOST` to its hostname. Keep development secrets and account resources separate from production.

No Cloudflare account credentials were available during initial implementation, so this configuration and a local build do not establish live deployment acceptance.

## Authorization and events

- `/parties/workspace/{workspaceId}` admits owners only; `/parties/conversation/{conversationId}` admits authorized owners and that visitor. Next.js authorizes database ownership before minting each token.
- `jose` verifies HS256, audience `realtime`, issued-at, expiry, a maximum 60-second lifetime, strict shared claims, and the exact room binding. All client `x-clarivo-*` headers are removed before admission; connection role and workspace come from verified claims only.
- Each socket admission lasts until the token expires. Durable Object alarms close expired sockets even during hibernation, and every outbound delivery also checks expiry. PartySocket obtains a fresh token through the authorized API on each reconnect, so domain removal or revoked membership cannot leave an indefinite subscription. Delivery stops within at most the remaining 60-second admission period; alarms may execute late, but expired sockets cannot receive events. The optional `access.revoked` publication closes matching visitor-host connections immediately when delivered.
- Only strict `{type:"typing",isTyping:boolean}` client messages are relayed, in conversation rooms, with the role derived from the connection. Other client actions are rejected. Typing is not persisted or queued across reconnects.
- Server POSTs require a separate bearer publishing secret, compared using Workers' `timingSafeEqual` on fixed-length SHA-256 digests. They accept only room-specific shared event schemas, check room identifiers, and bound the request body to 256 KiB. The web publication helper has a 2.5-second timeout and logs failure without rejecting a committed write. Tokens and message payloads are excluded from those logs.

## Reconnect and cache integration

`apps/web/lib/realtime/client.ts` opens the subscription first, then runs `loadSnapshot`, buffers events during the API read, applies the authoritative snapshot, and replays the buffer. It abandons stale snapshot completions when the connection closes. This covers events committed between the snapshot read and subscription admission; `newestConversation`, `mergeInboxItem`, and `mergeMessages` keep replayed entity versions monotonic and persisted message IDs unique. Publication failures are recovered from Postgres on reconnect, not retried as database writes.

The caller must provide a fresh API read, avoid applying a superseded snapshot outside this lifecycle, and use the exported reducers when handling events. In the inbox, recompute the active search/filter and waiting-first order after cache changes. Server event schemas are compiled into the Worker; redeploy after changing `packages/shared/src/realtime.ts`.

## Verification

```sh
pnpm --filter @clarivo/realtime typecheck
pnpm --filter @clarivo/realtime build
```

Manual acceptance requires valid owner and visitor tokens from the real API: verify missing/expired/wrong-room tokens, visitor workspace denial, header spoofing, invalid/server-only client messages, unauthorized publication, live replies, duplicate publication, and offline snapshot recovery. Remove an allowed domain while its socket is open and confirm API rejection and socket reauthorization failure within 60 seconds. No automated test framework is introduced.
