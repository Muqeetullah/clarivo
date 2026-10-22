# Connected live-chat development environment

This milestone uses Neon **development** only. Changes to existing production resources and Neon production schema remain outside its authorization. The user separately approved the initial Vercel production-labelled deployment of the isolated development-only project described below. Local `/demo` remains sample data; connected workspaces start empty. Knowledge ingestion and AI jobs are deferred.

## Resource identity and current status

Neon resources were verified on 2026-10-17; Vercel readiness and deployment reachability were rechecked on 2026-10-18:

| Resource                     | Development identity / status                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Neon project                 | `still-sunset-59008422`                                                                                                           |
| Neon branch                  | `development`, `br-shiny-brook-b41e2eyh`                                                                                          |
| Development compute          | `ep-icy-union-b4zhcmbp`                                                                                                           |
| Application schema           | `clarivo`; application migration applied to development                                                                           |
| Avatar bucket                | Dedicated development `profile-images`, `public_read`; authenticated writes                                                       |
| Private storage              | Existing `uploads` preserved; no access-policy change                                                                             |
| Neon jobs                    | `https://br-shiny-brook-b41e2eyh-jobs.compute.c-6.us-east-2.aws.neon.tech/`                                                       |
| Auto-close trigger           | `clarivo-auto-close-development`, `trigger-9d321e27-c65f-46eb-ade9-35a666298cf7`, **disabled** under zero-cost pause; no next run |
| Cloudflare deployment        | `https://clarivo-realtime-dev.clarivo-realtime.workers.dev` deployed; execution paused pending cost verification                  |
| Vercel deployment            | `https://clarivo-development.vercel.app`, READY; isolated development-only project                                                |
| Separate-site deployed embed | `https://clarivo-development-qvirx4zcd-muqeetullahs-projects.vercel.app`, static preview READY; browser acceptance pending        |

Neon configuration planning showed only the `jobs` function and its schedule being added. Deployment used explicit project/branch flags and `--no-env-pull`; it did not rewrite local environment files or mutate managed Auth settings. The schema migration is application-owned; follow [the DB guide](../packages/db/README.md), never the partial managed Auth mapping.

## Zero-cost pause and billing evidence

The user subsequently required all testing and deployment to cost absolutely zero. Provider deployments and application probes are stopped. The in-flight final Vercel deployment `dpl_HUewVprFNAACiH76cjPwNAJuBzmG` was canceled through Vercel's cancellation API and its CANCELED state was independently confirmed. The development Neon trigger was reversibly disabled (`enabled: false`, `next_run_at: null`); `apps/functions/neon.config.ts` also keeps it disabled so a future deployment cannot silently restart it. Existing resources and source work were preserved; no production resource or subscription was changed.

| Provider   | Actual account evidence                                                                                                                                                                                                    | Cost conclusion                                                                                                                                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vercel     | Team `team_s6WPCmsH8yJlItsDrPTQffLw`: `billing.plan=hobby`, `status=active`, `trial=null`. Usage CLI returned `Costs not found (404)`.                                                                                     | Hobby confirmed; exact accrued bill/remaining shared allowances were not available from that usage response.                                                                                                                                                           |
| Neon       | Organization `org-broad-haze-47284722`: `plan=free`; project owner reports `subscription_type=free_v3`.                                                                                                                    | Free plan confirmed. Official pricing separately includes 100 Postgres CU-hours, 1GB DB storage, 5GB object storage, 10 active/400 waiting function capacity-hours and 1M invocations per project. The schedule previously consumed allowances before it was disabled. |
| Cloudflare | Worker account settings return `default_usage_model=standard`. Account subscriptions API returns403 because the Wrangler OAuth credential lacks Billing Read. Native Chrome access for a dashboard check was not approved. | The `standard` usage model does not establish Free versus Paid subscription. Actual plan and monetary usage remain unverified; no zero-cost guarantee is justified.                                                                                                    |

The agent did not purchase, upgrade, or intentionally opt into a paid plan. That fact does not establish zero monetary usage on an account that might already have a paid subscription. [Vercel plan behavior](https://vercel.com/docs/plans) distinguishes Hobby quota pauses from paid overage; [Neon pricing](https://neon.com/pricing), [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) and [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) describe separate product allowances. Verify the actual Cloudflare Workers subscription and provider billing dashboard before permitting more execution. Do not resume from this document's historical deployment commands automatically.

Created development resources remain: the dedicated Vercel project (one ready web deployment, one ready static preview and one canceled final deployment), the `clarivo-realtime-dev` Worker with two Durable Object class bindings and two secrets, the development `jobs` function and disabled trigger, the `clarivo` application schema/migration, and the dedicated public-read avatar bucket with scoped credentials. Existing private uploads and Neon production were preserved. Exact already-incurred charges cannot be established from the available billing responses.

## Local environment

Use the Node and pnpm versions from the root manifest. The ignored `apps/web/.env.local` holds development values. Never copy production credentials or commit secrets. Owner authentication and the pooled database connection must identify the same development branch.

| Variable                                             | Purpose                                                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                                       | Server-only pooled development database connection                                                     |
| `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`      | Existing Managed Auth configuration                                                                    |
| `NEXT_PUBLIC_APP_URL`                                | Web origin used in the installation snippet                                                            |
| `VISITOR_TOKEN_SECRET`                               | Independent visitor HS256 signing key, at least 32 bytes                                               |
| `REALTIME_TOKEN_SECRET`                              | Independent realtime admission signing key, at least 32 bytes; shared only with the development Worker |
| `REALTIME_PUBLISH_SECRET`                            | Independent server publication key, at least 32 bytes; shared with Worker and jobs                     |
| `REALTIME_URL`                                       | Server-side HTTPS Worker origin; absent until Worker deployment                                        |
| `NEXT_PUBLIC_REALTIME_HOST`                          | Worker host for PartySocket; absent until Worker deployment                                            |
| `FUNCTIONS_SECRET`                                   | Independent bearer key for manual job invocation, at least 32 bytes                                    |
| `STORAGE_ENDPOINT`, `STORAGE_PUBLIC_BASE_URL`        | Development branch S3 endpoint and stable public object URL base                                       |
| `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY` | Server-only scoped development storage credential                                                      |
| `STORAGE_REGION`                                     | Development storage region (`us-east-2`)                                                               |

Each signing/publication/manual-invocation secret is distinct. A locally authenticated Clarivo owner session does not authenticate the Vercel or Cloudflare deployment CLI.

```sh
pnpm install
pnpm dev
```

Reuse an existing healthy Clarivo server on port 3000. The embed loader builds with the web dev/build commands. A separate test website must use another origin and the actual workspace snippet; the dashboard preview intentionally does not write visitors or conversations. A loopback-only development exception never marks installation complete. Production-style acceptance needs a configured allowed hostname, per-workspace CSP, and the deployed origins.

## Avatar storage

The dedicated development `profile-images` bucket was created as `public_read`; anonymous GETs work while writes need scoped credentials or short-lived presigned PUTs. Its CORS permits `http://localhost:3000`, methods PUT/GET/HEAD and the upload headers Content-Type/Cache-Control. The initial provider checks confirmed an allowed-origin preflight, an authenticated PUT, anonymous GET, unauthorized PUT rejection (403), and a disallowed-origin preflight rejection (403).

The dedicated web origin `https://clarivo-development.vercel.app` has also been added to this development bucket's CORS. Add any later development web origin before browser upload acceptance. Inspect its current rules first and retain localhost for local work. Never make `uploads` public or change inherited parent storage policy to fix an avatar issue. Avatar confirmation validates actual bytes, copies verified data to a fresh immutable key, commits that key, then retires old objects; unconfirmed or failed-cleanup orphans are acceptable for v1.

## Inactivity scheduler

Only `/triggers/auto-close` is implemented in `apps/functions`. There are no ingestion, suggested-question, attachment, or AI routes. `@neon/functions` 0.11.0 supplies trigger parsing and `waitUntil`; `@neon/config` 1.9.2 declares the function/schedule in `neon.ts`. Functions run Node.js 24 with Neon-injected `DATABASE_URL`.

The configured UTC cadence is every 15 minutes, but the remote trigger and checked-in configuration are currently disabled under the user's zero-cost constraint. Do not enable or deploy further cloud work until cost verification and renewed authorization. Each invocation processes up to 100 oldest open conversations with no message for 24 hours, then rechecks the cutoff under the same locks used by sends. Excess eligible conversations are processed on subsequent ticks. Closing persists the system notice and closed state in one transaction. Only after commit does the job attempt bounded publication of the state, saved notice, and owner inbox update. A failed/missing realtime provider leaves the durable closure intact; clients recover from the database on reconnect.

Neon's proxy strips client-supplied `X-Neon-*` headers. The job accepts a parsed trusted schedule delivery only for its declared trigger name, or an independently configured constant-time bearer secret for manual replays. It returns HTTP 202 and performs work with `waitUntil`. HTTP 202 proves acceptance, not completion; inspect function logs and persisted conversation state. The handler also rejects a runtime `NEON_BRANCH` other than `development`.

Build and inspect before deployment:

```sh
pnpm --filter @clarivo/functions typecheck
pnpm --filter @clarivo/functions build
neon config plan --config neon.ts --env apps/web/.env.local --project-id still-sunset-59008422 --branch br-shiny-brook-b41e2eyh
neon deploy --config neon.ts --env apps/web/.env.local --project-id still-sunset-59008422 --branch br-shiny-brook-b41e2eyh --no-env-pull
neon functions get jobs --project-id still-sunset-59008422 --branch br-shiny-brook-b41e2eyh
neon triggers list --project-id still-sunset-59008422 --branch br-shiny-brook-b41e2eyh
```

The prebuilt bundle includes the shared contracts and DB TypeScript sources; `server-only` resolves through the `react-server` bundler condition for this trusted Node process. `dist/` is generated and ignored. Secrets load from the ignored env file rather than shell arguments. If `REALTIME_URL` is added after the Worker deploys, rebuild and redeploy jobs so the new value reaches its runtime.

Provider-connected manual scheduler acceptance (2026-10-17) used an isolated fixture workspace `d58e3d0d-5ba5-4667-b587-969ecff8069b`: a 25-hour-idle waiting conversation closed, its system notice count increased once (3 → 4 messages), a repeated invocation left it at four, and a recently active conversation remained waiting. Anonymous and forged trigger-header POSTs both returned 401; bearer invocations returned 202. This verifies the deployed handler and database path, and provider logs also confirmed the native schedule delivery for `2026-10-17T14:45:00Z` completed at `14:45:02Z` (zero remaining eligible records). Realtime publication still needs a deployed Worker. The isolated fixture is retained for audit and contains no real visitor data.

Official references: [deploying Functions](https://neon.com/docs/compute/functions/deploy), [schedule triggers](https://neon.com/docs/compute/functions/triggers/schedule), [config reference](https://neon.com/docs/reference/neon-ts).

## Deployed web and separate test website

The initial web deployment `dpl_BD8bRY3yBdEAK7vg9YQFWUSFZGDm` is READY. Its deployment URL is `https://clarivo-development-8fwki8i4q-muqeetullahs-projects.vercel.app`, with the stable alias `https://clarivo-development.vercel.app`. The remote build installed the frozen pnpm11 workspace lockfile, emitted both Prisma contracts offline, built the real embed asset, compiled Next.js16.4.0, and passed the remote TypeScript step. Public probes returned `/`200, `/embed.js`200 with `public, max-age=300`, and anonymous `/dashboard`307 to `/login`. These probes do not prove authenticated owner or live chat acceptance.

The controlled separate-origin website is `https://clarivo-development-qvirx4zcd-muqeetullahs-projects.vercel.app` (`dpl_7knN6wEvrU2NHTHCBqp5kETDutzi`). It is a static **preview** in the same isolated development Vercel project, deployed through the documented Build Output API v3 with `vercel deploy --prebuilt --target preview`. It does not replace the stable web alias or change project root/build settings. Its HTML contains the real snippet for controlled workspace `31b8a7a5-58ec-475f-a226-aa7dc3570650`, loading `https://clarivo-development.vercel.app/embed.js`. Allow the exact preview hostname in that workspace's domain settings before testing. Its scratch source lives outside Git in `/tmp/clarivo-live-milestone/embed-development/`.

Cloudflare login succeeded on 2026-10-18 and the dedicated Worker was deployed at `https://clarivo-realtime-dev.clarivo-realtime.workers.dev` (version `64a60057-c851-469d-8007-6b95c48e46ad`, account `e280c80ded8f902535be8e1f9fba13e7`). It uses only the development Workspace/Conversation Durable Object classes and matching independent secrets. Wrangler registered the account's `clarivo-realtime.workers.dev` subdomain during this first deployment. Both real Worker URL variables were set on the development Vercel project and the ignored local web env; the Neon jobs runtime was updated too. Anonymous/wrong-secret publish probes returned401 and a correctly authenticated invalid payload returned400, proving the secret gate reaches schema validation. No valid-message publication or deployed socket round trip was performed before the new cost pause. The final web redeploy `dpl_HUewVprFNAACiH76cjPwNAJuBzmG` completed its remote build but was explicitly CANCELED before promotion under that pause. Therefore the stable web deployment remains the earlier build, without the newly configured realtime variables or final source fixes.

## Completing development deployment

Vercel login is complete (`muqeetullah`, scope `muqeetullahs-projects`). The user explicitly authorized an initial Vercel production-labelled deployment in the isolated **development-only** project `clarivo-development` (`prj_7BS8W2mJznB7FTq5qgsWXZ77La1r`). Its stable domain is `https://clarivo-development.vercel.app`. This exception applies to this new development project only; existing production resources remain outside scope. The project uses Node24, Next.js, root `apps/web`, outside-root workspace sources, `cd ../.. && pnpm install --frozen-lockfile`, and `cd ../.. && pnpm build`. The project's default Vercel SSO protection was disabled so the controlled iframe test can reach it; application owner authentication remains enforced. Development database/Auth/storage secrets were configured for this new project's preview and production-labelled targets without printing values. Localhost realtime URLs were excluded. Only the exact stable development origin was added to development Managed Auth trusted domains. Cloudflare login is now complete; the commands below are historical setup guidance. **Do not run further deploys or provider-connected tests while the cost pause is active.**

```sh
pnpm --filter @clarivo/realtime exec wrangler login
```

After login, verify account identity and choose the intended development account/project before any deployment. Configure the Worker's development `REALTIME_TOKEN_SECRET` and `REALTIME_PUBLISH_SECRET` from the matching web development values through Wrangler secrets, then run:

```sh
pnpm --filter @clarivo/realtime exec wrangler secret put REALTIME_TOKEN_SECRET --env development
pnpm --filter @clarivo/realtime exec wrangler secret put REALTIME_PUBLISH_SECRET --env development
pnpm --filter @clarivo/realtime deploy:dev
```

Record its real URL in `REALTIME_URL` and `NEXT_PUBLIC_REALTIME_HOST`. The isolated Vercel project is already configured and deployed as described above. Subsequent development web changes should deploy directly through the same linked project; keep the controlled static test site as a preview. Do not push Git, deploy to an existing production project, copy production env, or purchase/upgrade a plan. The explicitly authorized initial production-labelled deployment of `clarivo-development` remains a development deployment using development-only resources. Configure the preview origin in Managed Auth's existing allowed-origin configuration only with the appropriate provider authorization; do not fold unrelated OAuth/email acceptance or magic links into this milestone.

Update avatar CORS for the web origin, redeploy jobs with the Worker URL, and host a separate controlled test website containing the actual snippet. Verify visitor send → owner inbox → owner reply → visitor, refresh/history, reconnect recovery, closure/new conversation, tenant/domain restrictions, avatar replacement/removal, desktop/phone layouts and failure states. A successful build or a local fixture is not deployed acceptance.
