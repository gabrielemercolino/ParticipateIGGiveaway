const fs = require("fs");
const esbuild = require("esbuild");
const pkg = require("./package.json");

const version = pkg.version;
const meta = fs
  .readFileSync("tampermonkey.meta.js", "utf8")
  .replace("__VERSION__", version);

const injectUI = {
  name: "inject-ui",
  setup(build) {
    build.onEnd(() => {
      setUI();
      console.log("✅ Updated UI.");
    });
  },
};

const buildOptions = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "iife",
  target: "es2020",
  outfile: "dist/giveaways.user.js",
  banner: { js: meta },
  plugins: [injectUI],
};

async function build(watch = false) {
  if (watch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log("🔁 Watching for changes...");

    fs.watch("./ui", (eventType, filename) => {
      if (filename && eventType == "change") {
        ctx.rebuild();
      }
    });
  } else {
    await esbuild.build(buildOptions);
    setUI();
    console.log("✅ Build complete.");
  }
}

build(process.argv.includes("--watch")).catch((e) => {
  console.error(e);
  process.exit(1);
});

function setUI() {
  const uiHTML = fs.readFileSync("./ui/ui.html");
  const uiCSS = fs.readFileSync("./ui/ui.css");

  const bundelPath = "./dist/giveaways.user.js";
  const bundle = fs
    .readFileSync(bundelPath, "utf-8")
    .replace("__UI_HTML__", uiHTML)
    .replace("__UI_CSS__", uiCSS);

  fs.writeFileSync(bundelPath, bundle, "utf-8");
}
