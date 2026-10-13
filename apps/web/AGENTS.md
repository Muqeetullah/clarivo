# Clarivo web app

Follow the [root agent guide](../../AGENTS.md) for product scope, architecture boundaries, and verification. This file covers the Next.js dashboard.

## Where to work

- `app/page.tsx` renders the public landing page; `/demo` renders `components/dashboard.tsx` with local demo state. `app/dashboard/` contains server protected owner routes. `app/layout.tsx` owns metadata and the global stylesheet import.
- Before changing owner auth, read [the auth implementation and blockers](../../docs/AUTH.md). `lib/auth/` owns the Neon client, server instance, and verified owner guard. The SDK owns cookie and OAuth handling through `app/api/auth/[...path]/route.ts` and `proxy.ts`.
- `lib/demo-data.ts` owns the demo shapes and fixtures. Derive counts and lists from conversation state; keep prototype interactions in memory until persistence is explicitly implemented.
- `app/globals.css` owns the current theme tokens, layout styles, and responsive breakpoints. Preserve the light interface with violet accents unless the task changes the design.

## UI conventions

- Use the `@/` alias for application imports. Keep pages and layouts as server components; add `"use client"` at the interactive boundary that needs state, event handlers, or browser APIs.
- Read `components.json` before adding UI components. The current preset uses Base UI and Lucide icons; follow its APIs rather than assuming Radix composition. Check installed components and use the shadcn CLI and current docs for additions.
- Reuse the existing `Button`, `Badge`, `Card`, `Sheet`, `Tabs`, and form primitives. Forms use `FieldGroup`, `Field`, and associated labels. Conversation transcripts use `MessageScroller`, `Message`, `Bubble`, and `Marker`.
- Auth pages reuse `components/auth-ui.tsx` for cards, buttons, and feedback, plus the `.auth-shell` spacing variables in `app/globals.css`. Auth forms use the shared `useAuthReady` hook; keep provider and validation behavior in their existing modules.
- Use semantic theme tokens, existing variants, and `cn()` from `@/lib/utils`. Build responsive layouts with keyboard focus, accessible names, readable contrast, and reduced-motion support. Dialogs and sheets need titles.
- When connecting validated forms, use React Hook Form and shared Zod schemas. When connecting server data, use the agreed oRPC/TanStack Query approach; their installed presence does not mean the current local prototype has an API.
- Clarivo is the product name, `clarivo` the wordmark, and `@clarivo/web` the package name. Demo owner names are fixture identities, not branding.

## Verification

Use the root commands. For dashboard behavior changes, exercise the affected search/filter, reply, takeover, hand-back, or close flow and check that counts reflect it. Closed conversations must disable replies. For widget-preview changes, verify that edited values appear immediately and remain readable. Changes still reset on reload until persistence is built.

Preserve the framework-managed block below when editing this guide.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
