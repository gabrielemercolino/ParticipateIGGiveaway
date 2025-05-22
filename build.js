const fs = require("fs");
const esbuild = require("esbuild");
const pkg = require("./package.json");

const version = pkg.version;
const meta = fs
  .readFileSync("tampermonkey.meta.js", "utf8")
  .replace("__VERSION__", version);

const buildOptions = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "iife",
  target: "es2020",
  outfile: "dist/giveaways.user.js",
  banner: { js: meta },
};

async function build(watch = false) {
  if (watch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log("🔁 Watching for changes...");
  } else {
    await esbuild.build(buildOptions);
    console.log("✅ Build complete.");
  }
}

build(process.argv.includes("--watch")).catch((e) => {
  console.error(e);
  process.exit(1);
});
