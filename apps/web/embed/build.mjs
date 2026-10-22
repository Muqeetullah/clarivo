import { build, context } from "esbuild";
const options = {
  entryPoints: ["embed/index.ts"],
  bundle: true,
  minify: true,
  target: "es2020",
  outfile: "public/embed.js",
  format: "iife",
  sourcemap: false,
};
if (process.argv.includes("--watch")) {
  const ctx = await context(options);
  await ctx.watch();
} else await build(options);
