# Clarivo

A video-background landing page and a local customer-support dashboard following [the PRD](docs/PRD.md) and [technology stack](docs/TECH-STACK.md).

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

## New UI shells

- `/dashboard`: protected owner shell with a server verified session, profile, sign out, and a clear business setup pending state. No workspace is created in this slice.
- `/dashboard/inbox`: protected placeholder within the same shared layout.
- `/login`, `/signup`, `/verify-email`, and `/auth-error`: custom forms connected to Neon Managed Auth for password and Google sign in, with six digit verification and recovery. Magic links remain unavailable pending the documented security and verified account requirements. See [owner auth setup and verification](docs/AUTH.md).
- The homepage’s Log in link opens the new UI. `/demo` retains the existing interactive prototype.

## Included

- pnpm workspace with a Next.js 16 App Router app in `apps/web`, strict TypeScript, Tailwind CSS 4, and shadcn/ui (Base UI).
- Single-viewport landing page with the supplied background video, dot-matrix typography, responsive navigation, product information sheets, and a demo CTA. External video and font CDNs require network access; a local Geist Pixel font provides the display fallback.
- Overview with counts derived from demo conversations, an inbox with search and state filters, and waiting conversations sorted first.
- Conversation history and visitor context. Take over, send replies, hand back to the agent, and close conversations. Replying automatically changes the state to `human`.
- Knowledge source overview and an interactive chat widget appearance preview.
- React Hook Form, Zod, and TanStack Query installed for future connected features. They are not needed for the current local UI state.
- ESLint, Prettier, and a pnpm lockfile for reproducible installs.
- A server-only Prisma 8 read layer in `packages/db` validates email signup results against Neon Auth's stored user IDs. It creates no workspace or business data and performs no schema changes. Root dev, build, and typecheck commands generate its local contract artifacts first.

The public `/demo` uses labeled sample data in memory and needs no credentials. Owner authentication needs `apps/web/.env.local` as described in [AUTH.md](docs/AUTH.md); Neon owns account and session persistence. Business data, AI, uploads, real-time messaging, and the deployable widget remain unconnected. The remaining apps and packages from the technology stack will be added as their backend features are built.

The product documents live in `docs/` and were updated on October 12, 2026 for the Clarivo rename. `CONTEXT.md` is an initial glossary extracted from them; no separate glossary attachment was supplied. Dashboard assumptions are recorded in `docs/DASHBOARD.md`.
