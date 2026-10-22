# Clarivo design system

**Clarivo** is the customer support application defined in the PRD and technology stack. This design system governs its public presentation; product requirements and architecture remain unchanged.

## Direction

Thoughtful support. Human when it matters. The page should feel calm, cinematic, and precise: one full-bleed video, a floating navigation, an unmistakable dot-matrix headline, and generous negative space. No hero cards, animated headline gradients, fake customer logos, invented testimonials, or unmeasured performance claims.

The landing page is `/`. The existing local dashboard prototype is `/demo`. Main actions say “Explore the demo” and lead there. Product and How it works open informational sheets. Authentication is not connected. The homepage’s Log in link opens the UI-only `/login` form; `/signup` is available from there. Neither form creates or authenticates an account.

## Color

| Token / role            | Value                    | Usage                                    |
| ----------------------- | ------------------------ | ---------------------------------------- |
| Background              | `#000000`                | Video fallback, marketing canvas         |
| Foreground / primary    | `#ffffff`                | Headline, CTA, circular logo, navigation |
| Primary foreground      | `#000000`                | Text on white actions                    |
| Secondary               | `#28282a`                | Dark pills, padded icon rings            |
| Secondary foreground    | `#c8c8c8`                | Dark pill labels                         |
| Navigation text         | `#2e2e2e`                | White navigation links                   |
| Secondary hover         | `#323234`                | Dark action hover                        |
| Trust text / focus ring | `#c4c2c3`                | Product promise pill, keyboard focus     |
| Trust border            | `rgba(255,255,255,0.4)`  | Icon rings and promise pill              |
| Supporting text         | `#d0d0d0` at 80% opacity | Hero description                         |
| Footer muted            | `#8e8e8e`                | Supporting footer labels                 |

Marketing theme tokens live on `.landing-page`. The owner dashboard now uses its own scoped dark theme, while the public demo retains its light theme. Sheets render through a portal, so their surface and text colors are set explicitly in the shared global stylesheet. The background has a static dark scrim to preserve contrast across video frames.

## Typography

- UI: Inter, weights 400, 500, 600, loaded through the supplied Google Fonts stylesheet. Fallback: Segoe UI, system UI, sans-serif.
- Display: `BubbledotICG-FinePos`, loaded only from the supplied OnlineWebFonts CDN stylesheet. Fallback: local `Geist Pixel Circle`, then monospace. No local Bubbledot files.
- Geist Pixel Circle is distributed in `apps/web/public/fonts/`, with its license. It remains available if the external display font fails.
- Headline: local `Geist Pixel Circle` at normal weight (400), two lines, solid white, line-height 1.12. Responsive size reaches 80px on desktop, 88px on wide screens. Tracking is -0.04em, -0.08em below 720px, -0.09em below 420px. Mobile size is adjusted for the final, longer support headline. Footer symbols retain the display stack above.
- Supporting copy: approximately 16–19px, line-height 1.55. Navigation: 13–15px, weight 500. CTA: approximately 14px, weight 600. Footer feature values: 18–26px.

## Composition and responsive behavior

One viewport, three vertical regions: header, centered flexible hero, footer. Use `100dvh` with a `100vh` fallback. The background covers the full viewport without receiving pointer input. It uses the exact CloudFront MP4 from the supplied reference. Never download or replace it implicitly.

The header is centered within 720px: a circular graphic logo, white navigation pill, dark demo action. The logo asset is an original monochrome support mark in `public/assets/logo.svg`, used at 72% of its white circle. No source logo was supplied, so an SVG keeps it crisp at every density.

The hero promise uses three overlapping dark rings with 5px padding and white inner circles. Lucide knowledge, chat, and person icons replace the reference’s enterprise logos. The pill reads “Your knowledge. A human touch.”

The headline reads “Thoughtful support.” / “Human when it matters.” The description explains knowledge-grounded answers and human handoff. One glowing white CTA opens `/demo`. A small supporting line adds warmth without making a quantitative claim.

The footer contains four product pillars: Your knowledge, Human handoff, One inbox, One snippet. These are product capabilities from the PRD, not measured statistics. Do not count up non-numeric content. A Product preview label makes the current status visible; the explanatory sheets distinguish the product vision from the implemented demo.

At 720px and below, desktop navigation is replaced by a 48px menu control and footer pillars use two columns. Below 420px, trust rings shrink to 34px and headline tracking tightens. Below 700px height, vertical spacing tightens. Very short windows may scroll to preserve readable content and reachable actions rather than clip them.

## Components and implementation

Use the existing Next.js App Router, strict TypeScript, Tailwind CSS 4, and shadcn/ui with Base UI. Do not introduce a second UI framework or a parallel static HTML implementation.

- `Button`: existing primitive, extended with `marketing` and `marketing-dark` variants. Use those variants for marketing surfaces; use existing ghost and icon sizes for controls.
- Links styled as actions: Next.js `Link` plus the existing `buttonVariants` helper. Preserve native link semantics rather than nesting an anchor inside a button.
- Mobile navigation and product explanations: existing `Sheet`, `SheetTrigger`, `SheetContent`, `SheetTitle`, `SheetDescription`. Base UI owns focus trapping, dismissal, Escape, and trigger restoration. `SheetContent` accepts an optional overlay class to theme the marketing backdrop without changing dashboard sheets.
- Icons: installed Lucide icons. Font Awesome is unnecessary once unsupported enterprise endorsements are removed.
- Layout: semantic header, navigation, main section, footer, and definition list. Shared style tokens, page composition, and responsive rules remain in `app/globals.css`; Tailwind supplies the primitive utilities.
- Client boundary: `components/landing-page.tsx` owns sheet state, breakpoint dismissal, and background playback. Route components remain server components.

## Motion and accessibility

Use the reference’s cubic-bezier(0.22, 1, 0.36, 1), 700ms header entrance, 850ms content reveals, staggered headline lines, and a single restrained CTA entrance pulse. Hover lifts are small. No continuous UI pulsing or scanning text effects.

Respect prefers-reduced-motion: remove entrances and transitions and pause video playback. The footer has no playback control. Keep essential content visible without JavaScript. The black background and local font remain useful fallbacks when network assets are unavailable.

Provide a skip link, visible keyboard focus, meaningful navigation names, a single h1, an accessible home-logo link, and titles/descriptions for sheets. Decorative glyphs, video, and icons are hidden from assistive technology. Mobile navigation closes on dismissal, Escape, navigation, and resize above its breakpoint.

## Verification

Run root lint, typecheck, and build scripts. Manually inspect desktop and phone layouts, short-height behavior, headline fit, video playback and reduced-motion behavior, product and how-it-works sheets, mobile menu dismissal, keyboard navigation, and the demo link. This repository uses manual acceptance checks, not an automated test suite.

## Dashboard and auth shells

The layout-only addition uses Clarivo branding for owner Muqeet ullah, reusing `public/assets/logo.svg`. The existing landing page and `/demo` retain their Clarivo copy. `/dashboard` adapts shadcn `dashboard-01` with an inset main surface, Dashboard and Inbox navigation, an icon-collapse sidebar on desktop, a sheet on phones, and a bottom profile menu. Inner content remains a placeholder. Sidebar colors derive from the existing violet theme tokens.

`/login` and `/signup` adapt shadcn `login-02`: the form is on the left and a static black brand panel on the right, hidden below the desktop breakpoint. The panel reuses the local Geist Pixel Circle headline and puts the monochrome logo on a white circle for contrast. Forms share Field primitives, violet primary actions, explicit preview labels, and local validation. Social login and password recovery are omitted until authentication is implemented.

## Auth redesign — supplied dark reference

Login and sign-up now use shadcn `login-03` Card/Header/Content/Footer composition on a black canvas. A 400px card with a subtle border, centered heading, 48px controls, visible labels, 16px input text, and a white primary action follows the supplied screenshot. Email/password comes first; Google and the existing login magic-link mode appear as matching secondary buttons below a separator. The dashboard demo link is removed. A password visibility control uses shadcn InputGroup. Existing auth calls, validation, pending states, verification links, and hydration protection are preserved. Magic links remain for existing-account login; this visual change does not invent a passwordless signup flow.

The top-left mark sits in a white circle next to the `clarivo` wordmark. The reference governs layout only; auth pages use the landing page’s product name and copy: “Your knowledge. A human touch.”, “Thoughtful support. Human when it matters.”, and its knowledge-grounded AI / human-handoff description. The auth layout alone has scoped dark tokens, so dashboard and landing themes stay independent. The right side uses the exact landing-page video source with a rounded inset panel, a contrast scrim, the knowledge-grounding promise, and bottom-aligned pixel type. The visual panel is hidden below 1024px; the form scrolls on short screens. Playback pauses for reduced motion. The default canvas remains black when video is unavailable.

Design guidance checked: [shadcn Card](https://ui.shadcn.com/docs/components/base/card), [Input Group](https://ui.shadcn.com/docs/components/base/input-group), and [GOV.UK password guidance](https://design-system.service.gov.uk/patterns/passwords/). Applied visible labels, password-manager autocomplete, unrestricted paste, explicit password requirements, and password visibility. Backend password policies were not changed.

Verification: lint completed with the two existing internal-navigation warnings in auth components; strict typecheck passed. `pnpm build` completed successfully with Neon Auth cookie/prerender diagnostics from the existing dashboard owner guard. Browser inspection was blocked by the browser tool’s URL security policy, so the redesign’s desktop and phone rendering has not been visually verified in this run.

## Owner dashboard pages, October 14, 2026

Home is now the widget settings surface at `/dashboard`; Inbox lives at `/dashboard/inbox`. Keep exactly these two sidebar links. The public homepage remains unchanged. Home uses a settings card beside a visitor preview canvas, stacking on smaller screens. Inbox adapts the historical shadcn Mail list and detail composition with our current Base UI primitives and semantic conversation states. On phones, selecting a conversation replaces the list and exposes Back to inbox. No Copilot, email folders, team assignment or account switching is added.

These pages are explicitly local previews. Widget changes and conversation actions reset on leaving the route or reloading. Auth is connected through the owner guard, as documented in `docs/AUTH.md`; earlier descriptions of UI only authentication in this file are historical.

## Owner dashboard visual rebuild, October 14, 2026

Home and Inbox follow the dark Clarivo direction established on the landing and auth pages: near-black chrome, charcoal surfaces, subtle borders, Inter for controls, white primary actions, and restrained semantic state colors. The Home introduction uses the local pixel display face. No background video runs behind operational UI. Only Home and Inbox remain in the sidebar; the existing authenticated profile menu remains intact. Scoped `.owner-theme` tokens also travel to the mobile sidebar and profile popup. The public landing theme is unchanged.

Home separates widget appearance controls from a softly lit visitor-preview canvas. The widget itself retains a light visitor-facing surface with the editable accent color. Inputs are larger, color and position controls are aligned, and the setup note explicitly describes local state and unavailable installation. Inbox uses a compact two-panel composition with consistent conversation rows, expandable visitor metadata, readable message bubbles, right-aligned owner replies, and an inset reply composer. On phones, list and detail remain separate views with Back to inbox. Reduced-motion preferences suppress row transitions.

The conversation state hook, ready-source rules, data fixtures, authenticated routes, and sign-out behavior were not changed. Browser checks on the same components used a temporary development-only sample-data fixture; it was removed before the final build. No authenticated owner session was available, and both protected routes still redirected to login.

## Dashboard appearance preference

The dashboard header now has a shadcn appearance dropdown with Dark and Light radio items. Dark is the initial selection. `next-themes` persists the selected mode in localStorage under `clarivo-dashboard-theme`. Its root data attribute is scoped by `.owner-theme` CSS, so the dashboard, mobile sidebar and profile popup switch together while the landing, auth and public demo keep their existing themes. Dashboard surfaces and conversation states use theme tokens with light and dark palettes. The widget’s visitor-facing preview keeps its independent accent and light surface.

Manual verification on a temporary sample-data fixture covered dark default selection, switching to light, Home and Inbox readability, saved light and dark selection after reload, and the phone appearance menu. The fixture was removed. Dark was restored as the selected preference. Authenticated provider acceptance remains outside this check.

## Widget setup reference, October 15, 2026

Home now uses the supplied widget screenshots as the layout reference: full width setup checklist above a settings column and sticky preview. Appearance uses divided label and control rows; knowledge files show state badges; allowed domains use an inline add form; install uses a bordered code surface. The preview has browser chrome, accent header, knowledge label, suggestions and a composer. On phones, sections and preview stack and label rows become vertical.

The preview now follows the dashboard's light or dark semantic tokens for its surfaces. Its editable accent remains independent, with foreground contrast derived from luminance. Existing next-themes preference storage, portal theming and auth boundaries are preserved. All files, domains, installation and replies are explicitly local examples until backend integration.

## Widget polish, October 15, 2026

Dashboard document and body backgrounds now follow the owner theme during native overscroll. This styling only applies while the workspace shell is present. Saved theme UI uses a hydration snapshot so initial markup matches the server. Light mode uses softer secondary, muted and sidebar colors, white editing surfaces and restrained focus rings. The visitor preview canvas is neutral rather than tinted by the selected accent.

Widget accents now default to lighter shades, retaining computed foreground contrast. The custom control uses the official shadcn Base UI Popover and Slider primitives with RGB channels, hex validation and a Palette icon. There is no native color input or third party color picker dependency. Position cards depict a miniature page, agent header, chat window and a launcher that independently opens or closes the example. Setup steps have individual borders. Installation code has file chrome, line numbers and semantic syntax colors, while clipboard copying preserves the exact demo snippet.

## Visual color picker refinement

The custom picker now presents named basic color presets, a two dimensional shade area, a rainbow hue slider and optional hex entry. RGB channels are no longer exposed. Pointer and keyboard changes update the same controlled accent value and computed foreground contrast. The popup keeps shadcn Popover and Slider focus behavior, owner theme tokens, and a bounded scrollable height on phones.

## Inbox reference redesign, October 15, 2026

Inbox now uses the supplied three panel reference: compact avatar rows and segmented state filters, a spacious central transcript with right aligned agent and owner responses, and a divided visitor details column. Header actions and an inset bottom composer keep the transcript free of repeated metadata and toolbars. Semantic blue waiting and action tokens complement the existing neutral light and dark surfaces. The details panel hides or becomes a sheet on narrower screens. DiceBear Thumbs avatars, generated locally, identify anonymous visitors and distinguish agent and owner messages.

## Sidebar alignment and polish, October 15, 2026

The collapsed sidebar uses a wider rail and shared 44px square controls for the brand, Home, Inbox and account menu. Navigation labels are explicitly hidden in collapsed mode while accessible labels and tooltips remain. This prevents hidden text from pushing icons off center. Navigation icons are 22px; the logo is 44px expanded and 40px collapsed, with its original SVG kept intact. The account avatar is centered inside a matching rounded hover and open state. Expanded navigation adds a quiet Workspace heading, consistent spacing, subtle borders and semantic blue active styling. Mobile retains the existing sheet and account menu behavior.
