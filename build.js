import { context } from "esbuild";
import fs from "fs";
import pkg from "./package.json" with { type: "json" };

const watching = process.argv.includes("--watch");
const minify = process.argv.includes("--minify");
const version = `${pkg.version}${minify ? "-mini" : ""}`;

const outputFileName = `giveaways.${minify ? "mini." : ""}user.js`;

const meta = fs
  .readFileSync("tampermonkey.meta.js", "utf8")
  .replace("__VERSION__", version)
  .replaceAll("__FILE_NAME__", outputFileName);

const replacements = {
  __UI_HTML__: "src/ui/ui.html",
  __UI_CSS__: "src/ui/ui.css",
};

const injectUI = {
  name: "inject-ui",
  setup(build) {
    build.onEnd((res) => {
      if (res.errors.length > 0) return;

      const outFile = build.initialOptions.outfile;
      let contents = fs.readFileSync(outFile, "utf-8");

      for (const [key, filePath] of Object.entries(replacements)) {
        const content = fs.readFileSync(filePath, "utf-8");

        contents = contents
          .replace(new RegExp("\"" + key + "\"", "g"), "`" + content + "`") // with minify
          .replace(new RegExp(key, "g"), content); // without minify
      }

      fs.writeFileSync(outFile, contents, "utf-8");
      console.log("✅ Injected replacements.");
    });
  },
};

const options = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  minify: minify,
  outfile: `dist/${outputFileName}`,
  banner: { js: meta },
  plugins: [injectUI],
};

try {
  const ctx = await context(options);
  if (watching) {
    await ctx.watch();
    console.log("✅ Build complete. Watching for changes...");
  }
  else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log("✅ Build complete.");
  }
} catch (e) {
  console.error("❌ Build failed:", e);
  process.exit(1);
}