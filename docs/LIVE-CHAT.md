# Connected human live-chat milestone

Status: implementation and development acceptance in progress, October 18, 2026. This document records the implemented slice, not completion of the full AI-support PRD.

## Widget stylesheet correction, October 22, 2026

The Tailwind Turbopack rule matched every CSS file and forced CSS Modules through a plain CSS output type. The compiled widget module exported an empty object, so its React class names were missing. The rule now excludes `*.module.css`, preserving Next.js native scoping and class exports for both the widget and Markdown bodies. Browser inspection confirmed the header uses its scoped class, flex layout and 20px padding. At a measured 390px viewport, the header uses the mobile 16px top padding and the document has no horizontal overflow. Lint, all workspace type checks and a fresh production build passed. The failed sandbox build cache was preserved outside the repository before the successful fresh build. This verifies the styling correction, not the remaining full live chat acceptance checklist.

## Behavior and boundaries

Verified owners complete business-name onboarding once. Unique database constraints and transactional creation enforce one workspace and one separate owner membership. New workspaces contain no demo conversations or knowledge sources. `/demo` remains the independent public sample prototype.

Appearance and exact allowed hosts persist through versioned oRPC writes. Appearance previews remain local until Save changes; avatar upload/removal saves immediately. Avatar PUTs go directly to a dedicated public-read Neon bucket. The server bounds and decodes the uploaded bytes, writes a new final key that was never presigned, attaches it transactionally, and only then retires the previous image. Retrying an old confirmation cannot reattach a retired avatar.

Visitors receive HS256 widget JWTs bound to workspace, visitor and reported host. Only a per-visitor secret hash is stored. Current allowed domains are checked on visitor requests. Browser storage restores history; environments that block storage retain an in-memory session and explain the limitation. Each top-level page lifecycle has one visit UUID reused by iframe rendering and reconnects; a fresh page lifecycle counts a new visit. Geolocation is read only on Vercel, and raw IP addresses are not persisted. Missing location/device details display as unknown.

New conversations start `waiting` with `agent_off`. Opening the widget does not create a conversation. The first send persists the greeting, visitor message and waiting notice. Sending an owner reply atomically takes over. Closing rejects further owner replies; the visitor's next message creates another conversation while earlier transcript history remains available. Row locks and unique constraints serialize sends and enforce at most one open conversation per visitor. Client UUIDs make confirmed sends safe to retry.

Postgres commits precede realtime publication. PartyServer uses separate workspace and conversation rooms. Admission tokens last 60 seconds; active sockets are closed at their admission deadline and must obtain freshly authorized credentials on reconnect. Removing a domain immediately rejects visitor API requests and bounds existing socket access to that deadline. A publisher timeout never rolls back or falsely rejects an already committed send. Reconnect subscribes, reads an authoritative snapshot and replays buffered events. Message IDs and conversation versions prevent duplication or state rollback; pagination is rebuilt when membership or ordering changes.

The iframe and loader validate message shapes, source windows and exact origins. Per-workspace frame-ancestors uses the saved exact hosts; production has no localhost exception. A host reported by a non-browser client is not cryptographic proof of embedding. The loader is generated with esbuild during dev/build and served with a five-minute cache policy.

AI, ingestion, embeddings, suggested questions, knowledge uploads, attachments and hand-back to an agent remain deferred. Connected settings/inbox/widget surfaces contain no fabricated AI answers or Ready source stubs. Owner dashboard theme remains a separate browser preference.

## Provider resources and setup

See [DEVELOPMENT.md](DEVELOPMENT.md) for the development database branch, bucket, schedule, deployment URLs, environment names and commands. The application Prisma contract and migration history are separate from the managed Auth read contract; see [packages/db/README.md](../packages/db/README.md). Never migrate the partial Auth mapping.

The isolated Vercel development project has an explicitly authorized initial production-labelled deployment. This is an exception for that development-only project, using development Neon resources. Existing production resources, Git pushes and PR creation remain outside this milestone's authorization.

## Verification evidence

The lead's scratch progress and detailed manual probe evidence are in `/tmp/clarivo-live-milestone/`; concise browser captures belong in `artifacts/live-chat/`. No automated testing framework or suite was introduced.

| Layer | Observed result |
| --- | --- |
| Prisma migration | Applied one additive application migration to development; full schema/marker verification and migration preview passed with no pending operations. Managed Auth schema was not migrated. |
| DB acceptance | Concurrent onboarding, empty tenancy, stale settings, visit retries, first-send races, retry IDs, takeover, closure/send races, cross-tenant checks, DB uniqueness/FKs and controlled inactivity closure passed provider-connected probes. Fresh readback corroborated persisted results. |
| Avatar service | Real Neon PUT/anonymous GET, false MIME/oversize/foreign rejection, immutable final keys, replacement/removal and old-confirm retries passed. |
| Storage CORS | Required web origins allowed; disallowed-origin preflight and anonymous write rejected. Existing private uploads bucket retained its privacy. |
| Scheduler | Development Node24 job and 15-minute UTC trigger deployed. Anonymous/forged trigger requests rejected, controlled 25-hour conversation closed once, recent activity retained. Provider logs confirmed the native October 17 14:45 UTC schedule tick. |
| Root commands | Lint, strict types and production build passed during integration. Final reruns after the last remediation passed, including the production build. |
| OpenAPI | `/api/openapi.json` returned 200, OpenAPI3.2 with 17 paths before final deployment refresh. RPC and REST use the same implementation. |
| Owner browser | Real verified development session, normalized allowed hostname, explicit save and persistence after reload observed. Deployed direct avatar upload saved successfully. |
| Local separate origin | Real loader on localhost4000, persisted visitor send, owner reply/takeover, closing and next conversation with earlier history observed. Iterative HMR occurred; stable final socket/reconnect proof remains separate. |
| Remote web | Initial isolated development deployment built successfully and serves the real embed script. Anonymous dashboard redirects to login. |
| Remote separate origin | Controlled static preview serves the real snippet. Its exact hostname was saved through the deployed authenticated owner UI, and iframe bootstrap enabled the composer. The development Worker is deployed; final web deployment and cross-provider realtime acceptance remain incomplete. |

Browser storage behavior is proven only in the tested browser/context; this does not promise unpartitioned cross-site continuity in every browser. Notification permission, browser audio policies and mobile notification APIs can limit alerts while persisted chat remains available.

## Independent review

Two review cycles were requested and used. The first covered security, persistence, stack and product/UX. Confirmed findings included missing prior-conversation history, reconnect cursor gaps, avatar stale-save protection, in-flight Query overwrites, generated OpenAPI output, owner presentation, contrast and transcript scrolling. Security found no additional actionable issue.

The second cycle identified a remaining widget acknowledged-send/snapshot race, list offset-cursor changes under realtime removals, long agent-name header overflow and contrast thresholds for medium custom colors. Remediation and focused callback/layout checks passed. The second product reviewer was interrupted by account usage after saving its concrete report; its saved findings are retained. No further complete review cycle is planned. Final results and limitations must be updated before calling this milestone PR-ready.

## Remaining acceptance

- Respect the user’s zero additional cost constraint: cloud tests and deployments are paused while actual billing/free-plan limits are audited. The recurring development trigger is disabled. Do not resume metered work without a verified zero-cost path.
- The development Worker and matching endpoints are configured. Final web source deployment is incomplete; its in-progress deployment was submitted for cancellation when the cost constraint arrived. See DEVELOPMENT.md for the authoritative provider result.
- Prove remote visitor → owner → visitor delivery, typing, missed-message recovery, duplicates, closure/new conversation and revoked/cross-tenant access against the deployed Worker.
- Complete deployed avatar replacement/removal, history/reload, long content and phone/desktop light/dark browser checks. Validate actual viewport measurements rather than assuming an emulation request took effect.
- Record remaining browser/API limitations plainly. Do not replace these checks with mocks or compilation claims.

## Proposed reviewable change groups

The actual modules share one application migration and complete API contract, so three coherent PRs are preferable to the provisional five:

1. **Add workspace persistence and the connected live-chat API.** Shared contracts/events; separate Prisma application lineage and scoped access; owner workspace context/onboarding API; settings/avatar services; visitors/messages/lifecycle APIs; RPC/OpenAPI handlers and spec; server publication/token helpers. This remains buildable with the existing prototype owner screens.
2. **Connect the owner dashboard and embedded widget.** Business onboarding UI, saved settings/avatar/domain/install surfaces, connected inbox and visitor panel, real loader/iframe, browser Query/realtime integration, rendering and accessible failure states. Depends on1.
3. **Deploy development realtime and inactivity closure.** Worker/Durable Object and Neon job packages/configuration, root deployment/check commands, development-only hosting configuration, setup/status documentation and final acceptance evidence. Depends on1 and2.

No commits or PRs have been prepared. File-level grouping and buildability must be rechecked when creating the branches; no push or PR opening is authorized yet. The repository baseline is commit `7ef70b1` on `codex/dashboard-ui-polish`; unrelated screenshot files were preserved. The pre-existing stray backtick was removed only after explicit user approval.
