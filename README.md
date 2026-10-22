# Clarivo

Customer support that starts on your website and continues in one focused inbox.

Clarivo combines an embeddable chat widget, an owner dashboard and persistent conversation history. Built and owned by **Muqeet ullah**.

[Development app](https://clarivo-development.vercel.app) · [Product requirements](docs/PRD.md) · [Architecture](docs/TECH-STACK.md) · [Verification status](docs/LIVE-CHAT.md)

## Features and current scope

- Verified owner authentication and business onboarding.
- Persistent workspace settings, visitors, conversations and messages.
- Owner inbox with search, state filters, visitor context, replies, takeover and closing.
- Embeddable widget with configurable greeting, appearance, placement and avatar.
- Exact domain restrictions, signed visitor sessions and validated avatar uploads.
- PartyServer infrastructure for message delivery, typing and reconnect recovery.
- Local script playground with file upload and phone/desktop previews.

The current connected milestone supports **human chat**. AI answers, knowledge ingestion, suggested questions, hand-back and attachments remain deferred. New conversations wait for an owner reply. `/demo` is an independent sample dashboard. Full deployed live-chat acceptance remains in progress; the inactivity closure schedule is currently disabled.

## Technology

| Area                        | Implementation                                        |
| --------------------------- | ----------------------------------------------------- |
| Web                         | Next.js App Router, React and strict TypeScript       |
| UI                          | Tailwind CSS, Base UI and shadcn/ui                   |
| API                         | Shared oRPC contracts, Zod and TanStack Query         |
| Database and authentication | Neon Postgres, Prisma contracts and Neon Managed Auth |
| Realtime                    | PartyServer on Cloudflare Workers and Durable Objects |
| Storage and jobs            | Neon object storage and Functions                     |
| Web hosting                 | Isolated Vercel development project                   |

Workspace manifests and `pnpm-lock.yaml` record installed versions.

## Run locally

Requires **Node.js 24+**, **pnpm 11.25.0** and development service credentials.

```sh
git clone https://github.com/Muqeetullah/clarivo.git
cd clarivo
pnpm install
```

Configure the ignored `apps/web/.env.local` using [the environment variable reference](docs/DEVELOPMENT.md#local-environment). Authentication and the database must use the same development branch. Storage and realtime features need their corresponding configuration. Keep credentials out of Git.

Follow [the database guide](packages/db/README.md) for application migrations. The partial Managed Auth read contract is not a migration source.

```sh
pnpm dev
```

Open http://localhost:3000 for the landing page, or http://localhost:3000/demo for the dashboard prototype.

Verified owners complete onboarding, then use `/dashboard` for settings and `/dashboard/inbox` for conversations.

## Test the installation script

Start the app, then run this in a second terminal:

```sh
pnpm dev:playground
```

Open `http://localhost:4000`, paste the complete snippet from your workspace settings and choose **Load widget**. You can also upload an HTML, JavaScript or text file. Uploads stay in the browser; scripts execute when you choose to load them.

```html
<script
  async
  src="http://localhost:3000/embed.js"
  data-workspace="YOUR_WORKSPACE_ID"
></script>
```

Replace `YOUR_WORKSPACE_ID` with your actual workspace ID. Development mode admits `localhost` automatically, so you do not need to save it as a domain. Saved domains require exact DNS names such as `example.com`, without ports or wildcards. The local exception does not mark installation complete.

Send a visitor message, then reply from the owner inbox. AI answers are not connected yet. See [the realtime guide](apps/realtime/README.md) for local Worker setup.

The playground itself needs no hosting service. A real widget still contacts its configured backend services, even when the app runs locally. Local hosting alone does not guarantee zero provider usage.

## Development commands

```sh
pnpm lint
pnpm typecheck
pnpm build
```

| Command               | Purpose                                            |
| --------------------- | -------------------------------------------------- |
| `pnpm dev`            | Generate contracts and start the web app           |
| `pnpm dev:playground` | Start the dummy website on port 4000               |
| `pnpm lint`           | Check web ESLint rules                             |
| `pnpm typecheck`      | Check TypeScript across all workspaces             |
| `pnpm build`          | Build database contracts, embed loader and web app |
| `pnpm start`          | Serve the completed production build               |
| `pnpm format:check`   | Check repository formatting                        |

The project uses manual acceptance checks. Compilation alone does not prove connected behavior; see [the verification record](docs/LIVE-CHAT.md).

## Repository structure

```text
apps/web/                 Website, dashboard, widget and script loader
apps/realtime/            PartyServer Worker and authenticated rooms
apps/functions/           Inactive conversation closure
packages/shared/          API contracts, validation and event schemas
packages/db/              Server database access and migrations
tools/embed-playground/   Local script test website
docs/                     Requirements, architecture, setup and verification
```

## Deployment

The web app is available on the isolated [Vercel development project](https://clarivo-development.vercel.app). Web, Worker and function deployments are separate operations. A website deployment does not provision every connected service.

Cloudflare billing remains unverified, and the inactivity schedule stays disabled. Do not enable paid upgrades or subscriptions for testing. [DEVELOPMENT.md](docs/DEVELOPMENT.md) records environment configuration, provider resources and billing limitations.

## Connected owner dashboard

Verified owners complete `/onboarding` once, then use `/dashboard` for saved widget appearance, exact allowed domains, direct avatar uploads and the workspace installation snippet. `/dashboard/inbox` reads persistent conversations and visitor context, supports search and state filters, and lets the owner take over, reply and close.

The real iframe widget and built `embed.js` loader use signed visitor tokens, restore history and receive realtime events through PartyServer. New conversations start waiting for a human. AI, knowledge ingestion, suggested questions and attachments are deferred. `/demo` retains the independent, labeled sample prototype.

Read [development setup](docs/DEVELOPMENT.md) for environment variable names, provider resources and deployment commands. Read [milestone acceptance](docs/LIVE-CHAT.md) for checks, evidence and remaining blockers. The application Prisma migration lineage is separate from the managed Auth read contract, as described in [the database guide](packages/db/README.md).

The older UI iteration history remains in [DASHBOARD.md](docs/DASHBOARD.md). Auth provider acceptance and magic-link blockers remain in [AUTH.md](docs/AUTH.md).
