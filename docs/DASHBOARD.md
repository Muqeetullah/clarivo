# Clarivo: Initial dashboard

Last updated: October 12, 2026

Status: Assumed — an initial UI scaffold, based on the supplied PRD and technology stack.

This slice creates the pnpm workspace and the Next.js dashboard in apps/web. It uses a quiet, light interface with violet accents, a persistent sidebar, overview metrics, an inbox, conversation details, and a knowledge base summary. All conversations and sources are explicitly labeled demo data. Data is held in React state and resets on reload. No authentication, database, real-time transport, document ingestion, or AI calls are connected in this slice.

Values come from typed demo conversations and sources in apps/web/lib/demo-data.ts. Counts are derived from conversation state. Search matches visitor labels and message text. State filters use ai, waiting, human, and closed. Waiting conversations sort first. Sending an owner reply takes over, handing back sets ai, and closing sets closed. Closed conversations cannot receive owner replies. Anonymous visitors use generated labels, not invented identified customer profiles.

The knowledge screen lists example sources and explains that ingestion comes later. Widget settings are an interactive local preview; they do not install a widget or persist settings. There is one workspace and one owner, with no workspace switching, team management, or billing.

Verification: lint, strict typecheck, production build, browser checks for navigation, filtering, search, sending, takeover, hand-back, close, and mobile layout.

## Layout-only addition — October 12, 2026

The owner is Muqeet ullah. The shell uses Clarivo branding, the existing homepage logo and light/violet product colors. `/dashboard` uses the official shadcn `dashboard-01` sidebar, navigation, profile-menu, and header composition, without the block’s chart/table content or extra links. Dashboard and Inbox are the only sidebar destinations; `/dashboard/inbox` is a placeholder in the shared layout. Desktop navigation collapses to icons, mobile uses a sheet that closes on navigation, and the profile menu offers homepage/leave-preview navigation. Account settings are explicitly unavailable.

`/login` and `/signup` share the official `login-02` split composition with a branded static visual panel. Local browser validation and submit feedback work, but authentication is not connected and credentials are neither transmitted nor stored. A separate preview link opens the dashboard without implying successful authentication. No OAuth, password recovery, settings, billing, or additional inner pages were added. The existing interactive `/demo` prototype remains available.

Verification for the layout addition: lint and strict typecheck passed. Next.js production compilation and static generation passed with `pnpm --filter @clarivo/web exec next build --webpack`. The default Turbopack build was attempted but its CSS worker could not bind a port in the execution environment. Browser acceptance checks covered 1440px desktop and 390px phone layouts, active navigation, desktop collapse, profile menu, mobile sheet closure on navigation, login/signup links, required-field validation, preview submit feedback, and dashboard-preview navigation. The phone shell had no horizontal overflow. A desktop capture is saved at `artifacts/dashboard-shell/desktop.png`.

## Maintenance refactor — October 13, 2026

`components/dashboard.tsx` composes navigation, the overview/inbox conversation list, knowledge sources, widget settings/preview, and conversation detail from `components/dashboard/`. Conversation transitions and reply state live in the local `useConversations` hook; widget preview settings live with their screen. No global state library or persistence was introduced.

The Open conversations card selects an explicit Open filter that excludes closed conversations. Counts still derive from local conversation state. The unused sidebar cookie write was removed; sidebar expansion remains local UI state. Transcript styling now uses the current Message/Bubble/Marker components, with obsolete history/author selectors removed. Effective message-history and auth visual/headline definitions were consolidated. pnpm remains the sole lockfile owner; the redundant root npm lockfile was removed.

Manual browser checks covered the open-card destination, replies taking over, hand-back, closing and disabled replies, updated counts, and the phone open filter. Widget preview edits remain intact when navigating between screens; state continues to reset on reload. Screenshot evidence: `artifacts/maintenance/open-filter.png`.

## Owner dashboard pages, October 14, 2026

The protected `/dashboard` route now shows widget settings and a live local preview. `/dashboard/inbox` shows a mail inspired split layout with search, conversation state filters, a transcript and an owner reply composer. Home and Inbox are the only sidebar links. The public landing page remains unchanged.

The inbox reuses the existing typed demo fixtures and conversation transitions. Waiting conversations appear first. Replies take over, hand back waits for the next visitor message, and closing disables replies. Desktop shows list and transcript together; phones show one at a time with a Back to inbox control. Widget name, greeting, accent and bottom left or right position update the preview immediately. These screens use local React state, reset on leaving their route or reloading, and make no connected product writes. Installation remains explicitly unavailable.

The layout takes inspiration from the historical shadcn Mail example at commit `84bd724d97005f98b54d064aed5883b79aac1fd3`, adapted to the existing Base UI primitives rather than importing its legacy mail dependencies.

Manual verification used a temporary mock only preview route, removed after checking. Desktop and phone checks covered widget name and position updates, inbox search including no results, reply takeover, hand back, closing, derived counts and disabled closed replies. The protected dashboard redirects an unauthenticated browser to login. Signed in route acceptance still needs an authenticated session.

Final checks: `pnpm lint`, `pnpm typecheck`, and `git diff --check` passed. Production compilation, type checking and prerendering passed with `pnpm --filter @clarivo/web exec next build --webpack`. The default Turbopack build failed because its CSS worker could not bind a port in this environment. Screenshot evidence is in `artifacts/dashboard-pages/inbox-desktop.png`.

## Dark dashboard redesign, October 14, 2026

Rebuilt the owner Home and Inbox presentation to match Clarivo’s established dark visual direction. Home separates widget appearance from a visitor preview; Inbox emphasizes the conversation list, expandable visitor context, message history and reply composer. The sidebar, header, mobile sheet and profile popup share scoped dark tokens. The widget preview retains its light visitor surface and chosen accent. Existing local state transitions and auth guards are preserved.

Manual acceptance used a temporary development-only sample-data component fixture, removed before completion. Checks covered desktop and 390px phone layouts, no horizontal overflow, widget name and position updates, search including no results, state filters, reply takeover, hand-back, closing and disabled replies, mobile Back to inbox, sidebar collapse, mobile sidebar dismissal and profile popup theming. Protected routes redirected to login without an authenticated session; these checks do not establish live signed-in provider acceptance. Evidence: `artifacts/dashboard-redesign/home.png` and `inbox.png`.

Final checks for the redesign: lint, strict typecheck and the default Turbopack production build passed. `git diff --check` passed. No backend functionality or automated test suite was added.

## Dashboard appearance preference

The dashboard header now has a shadcn appearance dropdown with Dark and Light radio items. Dark is the initial selection. `next-themes` persists the selected mode in localStorage under `clarivo-dashboard-theme`. Its root data attribute is scoped by `.owner-theme` CSS, so the dashboard, mobile sidebar and profile popup switch together while the landing, auth and public demo keep their existing themes. Dashboard surfaces and conversation states use theme tokens with light and dark palettes. The widget’s visitor-facing preview keeps its independent accent and light surface.

Manual verification on a temporary sample-data fixture covered dark default selection, switching to light, Home and Inbox readability, saved light and dark selection after reload, and the phone appearance menu. The fixture was removed. Dark was restored as the selected preference. Authenticated provider acceptance remains outside this check.

## Widget setup interface, October 15, 2026

Home now follows the supplied widget setup reference: a three step checklist, appearance rows, knowledge source management, allowed domains, installation code and a sticky visitor preview. The layout stacks on phones. All new surfaces use the existing owner theme tokens and saved light or dark preference.

Appearance supports name, greeting, preset or custom accent, position and local avatar selection. The avatar object URL is released when replaced or unmounted. Knowledge sources show sample Ready, Processing and Failed states. File selection and dropping accept nonempty PDF, Markdown and TXT files up to 10 MB and add local metadata rows; there is no upload or ingestion. Avatar selection accepts PNG, JPEG, WebP and GIF up to 2 MB. Domains can be added or removed locally, full website URLs normalize to hostnames, and duplicate or invalid values show validation. The installation snippet uses an example domain and demo workspace, with copy feedback and an explicit preview warning.

The preview supports new visitor and after message states, suggested questions, scripted sample answers, a human handoff response, and minimizing. Answers depend only on the ready sample fixtures, never on newly selected file content. Removing a ready fixture makes its scripted answer unavailable. Changes reset on navigation or reload; no API calls or product writes were added.

Browser checks used a temporary mock route, removed before building. Desktop and phone layouts were inspected in light and dark modes. Scripted answers, missing source handoff, domain normalization and duplicate validation, and snippet copy feedback were verified. File picker automation stalled and was interrupted; file and avatar selection still need a manual browser acceptance check. Authenticated owner route acceptance remains separate from these mock UI checks.

Final validation for this slice: lint, strict typecheck, formatting and diff whitespace checks passed. Production compilation and prerendering passed with `pnpm --filter @clarivo/web exec next build --webpack`. Evidence: `artifacts/widget-setup/light-desktop.png`, `dark-desktop.png`, and `dark-phone.png`.

## Widget polish, October 15, 2026

Fixed the light document canvas showing behind the dark dashboard during overscroll, and fixed saved theme hydration mismatches. The light palette, input surfaces and preview canvas are softer. Setup cards have clearer borders; the installation snippet has line numbers and syntax colors. Lighter accent presets retain automatic foreground contrast. The custom picker composes official shadcn Base UI Popover and Slider primitives, with an explicit Palette icon, keyboard controls and hex input. Position examples now show agent headers and chat windows with working open and close launchers.

Browser verification on a temporary mock route covered light desktop, dark desktop, both phone themes, canvas color in both modes, hex updates, keyboard RGB slider changes and miniature widget toggling. The phone page had no horizontal overflow. The temporary route was removed. This change keeps installation and knowledge functionality as local mocks; it does not publish a live widget. Screenshot evidence is in `artifacts/widget-polish/`.

Validation for the polish: final lint and strict typecheck passed, as did webpack production compilation and prerendering. Theme reload no longer showed the hydration issue. Document and body backgrounds were both `rgb(16, 16, 18)` in dark mode and `rgb(250, 250, 250)` in light mode.

The custom picker was refined again to replace RGB controls with basic named colors, a visual shade area and rainbow spectrum slider. Browser checks confirmed preset selection, pointer and keyboard shade updates, immediate preview updates and theme support. The popup is constrained to available viewport height. Hex input remains optional. The temporary verification route was removed.

## Inbox reference redesign, October 15, 2026

The owner Inbox now follows the supplied support chat reference with three panels: a compact conversation list, a conversation workspace and a visitor details sidebar. All open excludes closed conversations; Waiting, Agent, You and Closed filters and text search remain available. Waiting items sort first. The first demo conversation is initially selected. Anonymous labels derive from the fixture city. The public demo keeps its existing overview and sheet presentation.

Chat actions now live in the header. The composer supports Command or Control plus Enter, preserves multiline Enter behavior, and disables closed replies. Replies take over, hand back waits for the next visitor message, and closing prevents further replies. The visitor details panel shows fixture location, local time, timezone, language, device, browser, system, page, referral, first and last seen, visits, conversation status and handoff reason. It can be hidden. Below 1200px it opens as an accessible sheet; phones retain separate list and conversation views with Back to inbox.

DiceBear core 10.7.0 and styles 10.6.0 generate deterministic Thumbs avatars locally from fixture IDs. The Thumbs style is CC0. No external avatar API or visitor data transmission is used. All conversation and visitor metadata remains mock data. Local selection and state reset on reload.

Manual checks on a temporary mock route covered dark desktop, light desktop, phone chat, visitor details sheet, back navigation, closed filter, disabled closed replies, empty search, reply shortcut takeover, hand back and closing. The mock route was removed before the build. Evidence: `artifacts/inbox-redesign/`. Signed in provider acceptance remains separate.

Final validation for the inbox reference redesign: lint, strict typecheck, formatting and diff whitespace checks passed. Production compilation and prerendering passed with webpack. The default Turbopack build still fails because its CSS worker cannot bind a port in this environment. New visitor profile fixtures live in `apps/web/lib/demo-data.ts` with the existing demo data.

## Sidebar alignment and polish, October 15, 2026

Collapsed logo, Home, Inbox and account controls now share 44px hit areas on one center line. Hidden navigation labels no longer consume width. The sidebar rail is wider, navigation icons and the logo are larger, and the account trigger is styled directly because the dropdown changes its component slot. Expanded sidebar spacing, borders, active colors and account hover/open states were refined. Home and Inbox remain the only navigation destinations; authentication and sign out handlers are unchanged.

Browser checks on a temporary mock route verified expanded and collapsed layouts, profile menu opening and dismissal, light and dark rendering, and the phone sidebar sheet. Measured collapsed control and icon centers all matched at x=41px in the verification viewport, with every control 44px square. The temporary route was removed. Screenshots: `artifacts/sidebar-polish/expanded.png` and `collapsed.png`.
