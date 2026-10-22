import { build } from "esbuild";

// Neon executes Node.js 24 ESM. The DB layer is intentionally server-only;
// its React guard has no runtime role in this trusted, non-React process.
await build({
  entryPoints: [new URL("./src/index.ts", import.meta.url).pathname],
  outfile: new URL("./dist/index.mjs", import.meta.url).pathname,
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  minify: true,
  conditions: ["react-server"],
  banner: {
    js: "import{createRequire as ___cr}from'node:module';import{fileURLToPath as ___f}from'node:url';import{dirname as ___d}from'node:path';const require=___cr(import.meta.url);const __filename=___f(import.meta.url);const __dirname=___d(__filename);",
  },
});
