# Shared live-chat contract

This browser-safe package owns the oRPC v2 contract, Zod inputs/outputs, exact-host normalization, and validated realtime/postMessage envelopes. It contains no provider clients or credentials.

- Import `contract` from `@clarivo/shared`; implement it with oRPC's `implement(contract)` in the web app. Serve that same router through RPC and OpenAPI handlers.
- Import schemas/domain types from `@clarivo/shared/schemas` and realtime schemas from `@clarivo/shared/realtime` to avoid loading OpenAPI in the Worker or embed loader.
- All entity IDs and send/visit IDs are UUIDs; wire dates are UTC ISO strings. Owner inputs never contain a workspace ID. Public widget config/start take a workspace identifier and reported exact host; subsequent visitor procedures use the bearer token.
- Settings saves require `expectedVersion`; avatar confirmation uses a server-created pending `uploadId`. The client cannot choose a storage key. Removal compares the expected nullable avatar key.
- Messages are limited to the PRD's 4,000 characters; avatars to 2 MB. The bounded metadata strings are untrusted input. Run server normalization before persistence; country/city and parsed user-agent details are server-owned. Raw IPs and client-supplied geolocation are absent from this contract.
- `visitId` identifies one top-level page visit and must survive iframe reload/reconnect; servers deduplicate it. Browser collection and server normalization are separate helpers. Missing/invalid metadata normalizes to null.
- History pages are oldest-to-newest within each returned page; `nextCursor` requests older messages. With no conversation ID, widget history includes prior closed conversations for the same visitor. Include the latest conversation even when it has no messages in that page.
- Send responses include the primary `message` and all `messages` persisted by the operation, including a first greeting/waiting notice. Retry the same body with the same `clientMessageId`; never regenerate it merely because the HTTP response was lost.
- Persistent realtime events have UUID `eventId`, workspace binding, and UTC `occurredAt`. Cache consumers deduplicate by message ID and compare conversation/settings versions. Subscription/reconnect must fetch authoritative history; event delivery is not durable.
- Clients may send only `clientTypingEventSchema`. Workers derive typing roles from verified claims. The runtime token union denies visitors access to workspace rooms. Domain revocation needs bounded socket reauthorization as well as best-effort `access.revoked` publication.
- postMessage schema validation complements exact origin and source checks; it does not replace them.

Version-specific references checked October 17, 2026:
[Procedure contracts](https://orpc.dev/docs/contract/contract), [OpenAPI routing](https://orpc.dev/docs/openapi/routing), and [typed errors](https://orpc.dev/docs/error-handling). v2 uses `.meta(openapi(...))`; `.route` requires an explicit optional extension. Packages are pinned to `2.0.0-beta.44`, and Zod to the web app's installed `4.6.5`.

Run `pnpm --filter @clarivo/shared typecheck` after installing workspace dependencies. There is no automated test framework in this package.
