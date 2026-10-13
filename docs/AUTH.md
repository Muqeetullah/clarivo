# Owner authentication

Status: implemented integration with outstanding live acceptance and magic link blocker, October 12, 2026.

This slice connects custom `/signup`, `/login`, and `/verify-email` forms to Neon Managed Better Auth through `@neondatabase/auth@0.6.0-beta`. `/api/auth/[...path]` delegates cookie, email OTP, and OAuth handling to Neon's same origin handler. `/dashboard` and `/dashboard/inbox` require a verified owner on the server. `/`, `/demo`, auth pages, the auth handler, and static assets remain public. `/demo` is the public product showcase, never an authentication link.

The dashboard shows the session owner's profile and a clear business setup pending state. No workspace, membership, or tenant data is created. No Clarivo application procedures exist yet. Future contract first oRPC procedures must resolve the owner from the server session and require a real membership before tenant access. The page redirect helper is not an oRPC authorization middleware.

## Local setup

Use Node 24 and pnpm 11.25.0. Install the lockfile. Copy `apps/web/.env.example` to `apps/web/.env.local`, set the development branch's full Auth URL, and generate `NEON_AUTH_COOKIE_SECRET` with `openssl rand -base64 32`. Set the server-only `DATABASE_URL` to the pooled database URL for the same branch; email signup uses a read-only stored-identity check. Prefer explicit `sslmode=verify-full`. Keep secrets server side, unique per deployment environment, and out of Git. No database password or OAuth secret belongs in a client variable. Root dev, build, and typecheck scripts emit the local Prisma contract before use; this needs no credentials or schema changes.

The SDK's Next.js client takes no arguments. The SDK proxy protects `/dashboard/:path*`, including OAuth verifier exchange on return to `/dashboard`. The app proxy also matches `/`: ordinary landing visits pass through publicly, while a return carrying `neon_auth_session_verifier` redirects to the fixed `/dashboard` path for the SDK to exchange it. Each protected page and layout also calls `requireVerifiedOwner`. It checks the upstream session and `user.emailVerified`, returns only identity, and never trusts client owner or workspace IDs. Reads are request local and wrapped in Suspense for the existing Next.js Cache Components configuration.

Pinned SDK compatibility detail: version 0.6.0-beta checks `query.disableCookieCache` against the string `"true"` before reading its signed session cache; the server query type accepts this serialized value. The guard passes the string to force an upstream check and `disableRefresh: true` to prevent session refresh cookie writes during Server Component rendering. The SDK proxy and route handler own refresh. A local upstream fixture reproduced a valid session failing when refresh emitted a cookie; the guard fix passed the same fixture and reload. Recheck these details when upgrading the SDK. No session or OAuth cookies are implemented by Clarivo.

Email signup explicitly requests an email verification OTP because both branches currently disable automatic verification sends. The owner enters the six digit code. Google uses the SDK social flow and returns to `/dashboard`; no Clarivo password is requested. An unverified returned session is sent to verification. Auth forms remain disabled until hydration and use POST as their native fallback. Errors use safe messages and offer retry or verification recovery.

## Inspected Neon state

Read only inspection used the Neon connector and authenticated Neon CLI. No remote settings, users, credentials, trusted domains, or provider secrets were changed.

Project `still-sunset-59008422` (Clarivo), AWS us-east-2:

| Setting                                       | Development (`br-shiny-brook-b41e2eyh`) | Production (`br-weathered-king-b4jir2fv`) |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------- |
| Email/password and signup                     | Enabled                                 | Enabled                                   |
| Require verified email                        | true                                    | false                                     |
| Automatic verification sends on signup/signin | false / false                           | false / false                             |
| Verification method                           | OTP                                     | OTP                                       |
| Auto sign in after verification               | true                                    | true                                      |
| Google credentials                            | Shared                                  | Shared                                    |
| Email provider                                | Shared Neon sender                      | Shared Neon sender                        |
| Trusted origins                               | Empty                                   | Empty                                     |
| Allow localhost                               | true                                    | true                                      |
| Magic link enabled                            | false                                   | false                                     |
| Magic link disable signup                     | false                                   | false                                     |

The intended development and production settings are not consistent. The application enforces verified email regardless, but production must be deliberately reconciled before release. No production configuration was changed.

## Magic link blocker

Magic link issuance and redemption through the app return 503. The UI explains that email link sign in is unavailable and offers password or Google. It never claims a message was sent. A future successful request must use a neutral check your email response without disclosing account existence.

There are two unresolved constraints:

1. Neon's Managed plugin exposes `enabled`, `expires_in`, and `disable_sign_up`. It has no documented restriction to accounts verified _before_ link issuance. Better Auth can verify an existing unverified account when redeeming a link. A session `emailVerified` check after redemption cannot enforce the requested preexisting verified account rule. A future solution needs a documented Managed guarantee or a server side account eligibility lookup through the agreed database boundary, plus controlled runtime verification. No client flag is sufficient.
2. Neon's current overview documents Managed Better Auth 1.7.6. Advisory GHSA-965c-763c-88jm affects versions before 1.7.7 when magic links, social OAuth, and certain default verification storage are combined. Managed deployment internals and backports are not visible here. Keep the plugin disabled until Neon confirms a fix or equivalent mitigation for the deployed service. `disable_sign_up: true` alone does not mitigate the advisory.

After both constraints are resolved, enable the development plugin with signup disabled, verify unknown, unverified, verified, expired, and replayed links against the actual Managed service, and only then intentionally mirror approved settings to production. No silent fallback to passwordless OTP or self hosted Better Auth is included.

Primary references checked:

- [Neon Next.js API quick start](https://neon.com/docs/auth/quick-start/nextjs-api-only)
- [Email verification](https://neon.com/docs/auth/guides/email-verification)
- [OAuth setup](https://neon.com/docs/auth/guides/setup-oauth)
- [Magic link configuration API](https://api-docs.neon.tech/reference/updateneonauthmagiclinkplugin)
- [Neon overview and documented server version](https://neon.com/docs/auth/overview)
- [Better Auth magic link semantics](https://better-auth.com/docs/plugins/magic-link)
- [Upstream advisory](https://github.com/better-auth/better-auth/security/advisories/GHSA-965c-763c-88jm)

## Production and deferred work

No deployment is included. Before release, reconcile required email verification across branches, register the exact production and preview trusted origins, provision owner controlled Google credentials with callback `{NEON_AUTH_BASE_URL}/callback/google`, and use a dedicated email provider with verified sender domain. Use the official [production checklist](https://neon.com/docs/auth/production-checklist) and [trusted domain guide](https://neon.com/docs/auth/guides/configure-domains). Generate the app cookie secret in the hosting environment.

Password reset, business name onboarding, workspace/membership persistence, and business data are deferred. Live email delivery, Google consent/return, provider cancellation, and same-email Google/password account linking require controlled test accounts and a test mailbox. No real accounts were accessed and no messages were sent during implementation. Do not claim account linking from upstream defaults.

## Acceptance evidence

Final repository checks passed: lint, strict TypeScript, and the production build. Commands used `pnpm --config.verifyDepsBeforeRun=false lint`, `typecheck`, and `build`; the temporary option bypassed pnpm's dependency-store revalidation in this sandbox without changing repository configuration. No automated test suite was added. After restoring the real development configuration, the browser confirmed `/dashboard/inbox` redirects to `/login` without a session, `/` and `/demo` remain public, and the hydrated login controls are interactive.

A temporary local HTTPS mock was used only for manual acceptance. It ran outside the repository, with its certificate trusted only by the test app process. The real SDK handled cookies and verifier exchange. Mock sessions were memory only; this cannot prove Neon delivery, deployed configuration, or Google account linking. No mock behavior is present in application source or production flags. The mock was stopped after acceptance and the local app restored to the real development branch configuration.

Desktop (1440 × 1000) and phone (390 × 844) browser checks exercised:

- Email signup, explicit verification send, invalid code, resend, valid verification, and protected dashboard arrival using fixture accounts.
- Incorrect password, duplicate signup guidance, unverified sign-in recovery, pending controls, and auth service failure messages.
- Session restoration after reload, keyboard sign-out, and a subsequent direct protected inbox visit redirecting to login.
- A simulated Google SDK challenge and verifier return reaching the protected dashboard without a separate password.
- Magic link requests returning unavailable, safe auth error output, and public landing and showcase routes.

Screenshots are saved in `artifacts/auth/`. These are local fixture observations, not live provider acceptance. No real email was sent and no third-party account was accessed. Live email signup/verification, Google consent and cancellation, same-email account linking, session expiry/revocation, and eventual magic link eligibility/replay checks remain outstanding. Production configuration remains unchanged.

Four independent read-only reviews covered route security, SDK/OAuth correctness, UX/recovery, and specification/verification coverage. The SDK review's confirmed session refresh issue was reproduced, fixed, and accepted in the second review cycle. No unresolved confirmed P1/P2 code findings remain; the provider and magic link limitations above remain release blockers. Researchers used GPT-6 Luna at max effort, implementers GPT-6 Astra at low (the requested light effort is unavailable), and reviewers GPT-6.1 Sol at medium.

Concurrent edits to the auth layout, forms, and styles were preserved. The October 13 follow-up explicitly uses the current dark login card as the reference for signup and verification.

## Signup identity and UI follow-up — October 13, 2026

Read-only development counts showed no duplicate email groups: two users, two Google identities, and zero password credentials. Better Auth's required-verification signup intentionally returns a synthetic success for an existing email. The previous client treated it as a new account, then requested verification and could sign into the existing Google-only identity. A successful HTTP response alone did not prove a second account or password credential was created.

The same-origin auth handler now checks successful email signup's upstream-generated user ID through `@clarivo/db`. A stored ID preserves the SDK response; a synthetic ID returns 409 `USER_ALREADY_EXISTS`. The form shows existing-account guidance and does not request a verification email for that response. The check never accepts a client-supplied identity and exposes no database client or user records. It intentionally exposes duplicate signup status as requested; required email verification and Google's SDK cookie flow remain enforced. Database/setup failures return a retryable 503 instead of claiming signup succeeded. Password reset remains deferred; signup does not attach a password to an existing Google account.

`packages/db` uses Prisma CLI 8.0.0-rc.22 and PostgreSQL runtime 8.0.0-rc.17 with a lazy reusable pool and bounded connection timeout. It maps only the managed user's ID, has no mutation exports, and must never migrate or sign Neon's managed schema. No database migrations, tenant records, provider changes, or production changes were made.

The verification form now uses shadcn InputOTP's six digit blocks, paste/autocomplete and keyboard support, inside the same card as login/signup. Email comes from the verification destination and is displayed as context rather than an editable field; a missing or invalid address provides login recovery. Auth spacing is tighter, focus is softer, and the Google logo uses its four colors. The Google loading state remains visible during navigation.

Manual fixture checks using the actual route handling and actual development database read helper passed: stored identity 200, synthetic UUID 409, synthetic non-UUID 409, missing configuration 503. No signup or email was sent by those checks. Automatic approval review rejected a separate live duplicate-signup probe against a real development Google identity because a new password could affect credentials or trigger email; that probe was not executed. Full live account-flow acceptance remains distinct from the fixture and read-only evidence.

An independent browser agent passed current desktop/phone layout, local validation, password visibility, OTP numeric paste and editing, missing-email recovery, and long-email wrapping. In an isolated build using a local auth fixture, duplicate signup stayed on signup with existing-account guidance; incorrect password restored controls; Google callback reached the dashboard, restored after reload, and keyboard sign-out protected the inbox. Live initiation on the development configuration reached Google's account chooser without selecting an account. A temporary development hydration failure after dependency installation resolved after stopping the server and cleaning only its generated development cache; font isolation did not fix it and the original fonts were restored. A separate read-only security review found no actionable issues in the new response check or database boundary. Current screenshots use `review-*-current.jpg` and `review-duplicate-signup-fixture.jpg` under `artifacts/auth/`.

## Google callback diagnosis — October 13, 2026

The development app log contained a successful social initiation followed by a return to `/?neon_auth_session_verifier=…`. The previous proxy matched only dashboard routes, so the root rendered the public landing page without exchanging the verifier. A local HTTP probe reproduced that gap: a root URL with a fixture verifier returned 200 and no redirect. It now returns 307 to the fixed `/dashboard` destination, preserving the verifier for the SDK. Plain `/` and `/demo` still return 200. Invalid verifier exchange redirects to login and grants no dashboard access.

The Google button now shows a spinner and “Connecting to Google…” until SDK navigation, announces progress to assistive technology, and restores controls on request errors. Both new and returning Google users explicitly target `/dashboard`; no separate password is required. A `prompt: select_account` request is supplied through the installed SDK's supported `additionalParams`, but the live shared-provider redirect omitted this parameter. Google account selection was observed in this browser, not guaranteed across already authorized Google sessions. Do not claim that the shared provider always forces account selection.

Desktop and phone browser checks captured the loader. The live development initiation reached Google's account chooser; no account was selected. An isolated manual fixture exercised the actual app proxy and installed Neon SDK through root redirect, verifier exchange, verifier removal, session cookie issuance, and restoration of a verified fixture owner. The real development app was not switched to the fixture. Lint, strict typecheck, and production build passed. Full live Google consent/return and account linking remain unverified. No provider or production settings were changed.

## Guest-only routes and login feedback — October 13, 2026

The clarified report was that a signed-in owner could manually open `/login`. The missing behavior was a server-side guest-only guard; this observation alone did not establish that the session cookie had been lost. Login and signup now inspect the server session inside Suspense: verified owners redirect to `/dashboard`, unverified owners redirect to `/verify-email`, and guests can use the forms. Verified owners also leave the verification page for the dashboard. Public landing/demo and error recovery remain public. Dashboard guards still reject guests and unverified sessions. All guards share a request-local session read with the existing upstream cache bypass and refresh disabled during Server Component rendering; cookie/session handling remains with the Neon SDK.

Authentication failures now use a red shadcn destructive Alert with an icon and title directly before the submit button, with accessible alert semantics and verification recovery inside the message. Neutral email-link feedback retains status semantics.

Manual browser acceptance used the actual built app and installed SDK against a local-only auth fixture: unauthenticated inbox access redirected to login; a verified password login reached dashboard and survived reload; manually visiting login, signup, or verification returned to dashboard; sign-out restored guest login/signup and protected inbox access again. Desktop (1440×1000) and phone (390×844) error presentation passed. A separate throwaway guard probe covered unverified redirects and verified/guest access rules. Lint, strict typecheck, and production build passed. No real account, email, or production configuration was changed. Screenshots: `artifacts/auth/login-error-alert-desktop.jpg` and `login-error-alert-phone.jpg`.

## Shared auth presentation — October 13, 2026

Login, signup (including the email-link mode), verification, and interrupted-sign-in recovery compose `components/auth-ui.tsx`: `AuthCard` owns header/content/footer structure, `AuthButton` owns control sizing/variants, `AuthFeedback` owns error/status semantics. New auth screens should reuse these primitives instead of duplicating card markup. `lib/auth/use-auth-ready.ts` shares the existing pre-hydration submission guard across forms.

The `.auth-shell` variables in `app/globals.css` own card width/padding, panel padding, field/header gaps, control height/radius, and input insets, including phone overrides. Verification and recovery now use the same feedback treatment and button sizes as login. Backend authentication and access rules were not changed in this presentation refactor.

Lint, strict typecheck, and production build passed. Browser checks covered all four pages at desktop and phone widths, recovery-button navigation, and local OTP validation. No live signup, email, or account operation was performed. Screenshots use `artifacts/auth/shared-auth-*.jpg`.

## Proposed pull requests

No commits, pushes, or pull requests were created. The repository has no first commit and no Git remote. Proposed count: **one auth pull request**, after an approved repository initialization records the existing prototype foundation from the saved pre-auth baseline. A first baseline commit must exist before an auth PR can compare against it. Keep concurrent user changes distinguishable while preparing that baseline and the auth branch. Configure the intended GitHub repository and obtain approval before initialization, committing, pushing, or opening the PR. Keep environment files, dependency stores, and temporary harness material out of Git.

Session checks remain server-side through the Neon SDK and its cookies. Auth and dashboard Suspense boundaries now use an empty fallback instead of exposing technical session-check text. The shared `--control-height` token sets the default Input/InputGroup height across forms (compact dashboard search retains its explicit sizing). The auth input rule applies the same 48px height, radius, and padding tokens to every plain text/email/name input; password groups and OTP blocks use that same height token.

## Maintenance fixes — October 13, 2026

Verification now offers “Use a different account” through the SDK sign-out flow; login navigation occurs only after sign-out succeeds. Guest-only server guards remain enforced. Login/signup schemas in `lib/auth/credentials.ts` trim email before validation and keep signup name/password requirements together. `credential-error.ts` maps returned and thrown failures identically, prioritizing service failures and rate limits over credential codes. The login component renders shared form UI; `use-login-form.ts` handles credentials and verification recovery, with Google and magic-link workflows in separate modules. Magic links remain blocked as documented above.

Auth route, session-reader, and proxy failures emit bounded server diagnostics: operation, numeric status, allowlisted error name, and machine error/cause codes. Messages, stacks, URLs, cookies, request bodies, and identities are omitted. The shared `BackgroundVideo` manages landing/auth loading, playback, and reduced motion. Auth video loads only at the visible desktop breakpoint; returning to phone or reduced motion releases its source.

Manual schema probes passed trimmed email, separate signup rules, credential/verification errors, and returned/thrown 503 handling. Phone browser inspection confirmed no auth video source and paused playback. Live provider acceptance and unverified-session sign-out acceptance remain outstanding; no account was created or verification email sent for this maintenance work.

Final maintenance checks: lint and strict typecheck passed; the Webpack production build (`pnpm --config.verifyDepsBeforeRun=false --filter @clarivo/web exec next build --webpack`) passed. The default Turbopack build was attempted twice and failed because its CSS worker could not bind a local port in this environment. Browser checks confirmed desktop auth playback, phone auth source removal, local signup validation, and the verification change-account action returning a guest to login. A real unverified session was not used. Provider settings remain unchanged.
