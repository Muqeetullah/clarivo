# Clarivo

A customer-support dashboard with a connected human live-chat milestone, plus a public sample demo, following [the PRD](docs/PRD.md) and [technology stack](docs/TECH-STACK.md).

## Run locally

Requires Node.js 24+ and pnpm 11.25.0.

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000 for the landing page, or http://localhost:3000/demo for the dashboard prototype.

The landing, auth flow, and dashboard use Clarivo. See [design.md](design.md) for the landing page design system.

```sh
pnpm lint
pnpm typecheck
pnpm build
```

## Connected owner dashboard

Verified owners complete `/onboarding` once, then use `/dashboard` for saved widget appearance, exact allowed domains, direct avatar uploads and the workspace installation snippet. `/dashboard/inbox` reads persistent conversations and visitor context, supports search and state filters, and lets the owner take over, reply and close.

The real iframe widget and built `embed.js` loader use signed visitor tokens, restore history and receive realtime events through PartyServer. New conversations start waiting for a human. AI, knowledge ingestion, suggested questions and attachments are deferred. `/demo` retains the independent, labeled sample prototype.

Read [development setup](docs/DEVELOPMENT.md) for environment variable names, provider resources and deployment commands. Read [milestone acceptance](docs/LIVE-CHAT.md) for checks, evidence and remaining blockers. The application Prisma migration lineage is separate from the managed Auth read contract, as described in [the database guide](packages/db/README.md).

The older UI iteration history remains in [DASHBOARD.md](docs/DASHBOARD.md). Auth provider acceptance and magic-link blockers remain in [AUTH.md](docs/AUTH.md).
