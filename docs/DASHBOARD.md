# Clarivo: Initial dashboard

Last updated: October 12, 2026

Status: Assumed — an initial UI scaffold, based on the supplied PRD and technology stack.

This slice creates the pnpm workspace and the Next.js dashboard in apps/web. It uses a quiet, light interface with violet accents, a persistent sidebar, overview metrics, an inbox, conversation details, and a knowledge base summary. All conversations and sources are explicitly labeled demo data. Data is held in React state and resets on reload. No authentication, database, real-time transport, document ingestion, or AI calls are connected in this slice.

Values come from typed demo conversations and sources in apps/web/lib/demo-data.ts. Counts are derived from conversation state. Search matches visitor labels and message text. State filters use ai, waiting, human, and closed. Waiting conversations sort first. Sending an owner reply takes over, handing back sets ai, and closing sets closed. Closed conversations cannot receive owner replies. Anonymous visitors use generated labels, not invented identified customer profiles.

The knowledge screen lists example sources and explains that ingestion comes later. Widget settings are an interactive local preview; they do not install a widget or persist settings. There is one workspace and one owner, with no workspace switching, team management, or billing.

Verification: lint, strict typecheck, production build, browser checks for navigation, filtering, search, sending, takeover, hand-back, close, and mobile layout.

## Layout-only addition — October 12, 2026

The user requested Marshall Desk branding for a new shell, using the existing homepage logo and light/violet product colors. `/dashboard` uses the official shadcn `dashboard-01` sidebar, navigation, profile-menu, and header composition, without the block’s chart/table content or extra links. Dashboard and Inbox are the only sidebar destinations; `/dashboard/inbox` is a placeholder in the shared layout. Desktop navigation collapses to icons, mobile uses a sheet that closes on navigation, and the profile menu offers homepage/leave-preview navigation. Account settings are explicitly unavailable.

`/login` and `/signup` share the official `login-02` split composition with a branded static visual panel. Local browser validation and submit feedback work, but authentication is not connected and credentials are neither transmitted nor stored. A separate preview link opens the dashboard without implying successful authentication. No OAuth, password recovery, settings, billing, or additional inner pages were added. The existing interactive `/demo` prototype remains available.

Verification for the layout addition: lint and strict typecheck passed. Next.js production compilation and static generation passed with `pnpm --filter @clarivo/web exec next build --webpack`. The default Turbopack build was attempted but its CSS worker could not bind a port in the execution environment. Browser acceptance checks covered 1440px desktop and 390px phone layouts, active navigation, desktop collapse, profile menu, mobile sheet closure on navigation, login/signup links, required-field validation, preview submit feedback, and dashboard-preview navigation. The phone shell had no horizontal overflow. A desktop capture is saved at `artifacts/dashboard-shell/desktop.png`.

## Maintenance refactor — October 13, 2026

`components/dashboard.tsx` composes navigation, the overview/inbox conversation list, knowledge sources, widget settings/preview, and conversation detail from `components/dashboard/`. Conversation transitions and reply state live in the local `useConversations` hook; widget preview settings live with their screen. No global state library or persistence was introduced.

The Open conversations card selects an explicit Open filter that excludes closed conversations. Counts still derive from local conversation state. The unused sidebar cookie write was removed; sidebar expansion remains local UI state. Transcript styling now uses the current Message/Bubble/Marker components, with obsolete history/author selectors removed. Effective message-history and auth visual/headline definitions were consolidated. pnpm remains the sole lockfile owner; the redundant root npm lockfile was removed.

Manual browser checks covered the open-card destination, replies taking over, hand-back, closing and disabled replies, updated counts, and the phone open filter. Widget preview edits remain intact when navigating between screens; state continues to reset on reload. Screenshot evidence: `artifacts/maintenance/open-filter.png`.
