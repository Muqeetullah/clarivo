import { defineConfig } from "@neon/config/v1";

// Apply only to the explicit development branch; see docs/DEVELOPMENT.md.
export default defineConfig({
  functions: {
    jobs: {
      name: "Clarivo development conversation auto-close",
      source: "apps/functions/dist/index.mjs",
      bundler: "none",
      env: {
        FUNCTIONS_SECRET: process.env.FUNCTIONS_SECRET!,
        ...(process.env.REALTIME_URL
          ? { REALTIME_URL: process.env.REALTIME_URL }
          : {}),
        REALTIME_PUBLISH_SECRET: process.env.REALTIME_PUBLISH_SECRET!,
      },
    },
  },
  triggers: {
    "clarivo-auto-close-development": {
      type: "schedule",
      function: "jobs",
      functionPath: "/triggers/auto-close",
      cron: "*/15 * * * *",
      // Paused under the user's strict zero-cost requirement. Do not re-enable
      // without verified provider allowances and renewed execution authorization.
      enabled: false,
    },
  },
});
