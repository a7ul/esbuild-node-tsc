import { build } from "esbuild";
import glob from "globby";
import cpy from "cpy";
import path from "path";

async function buildSourceFiles(srcDir: string, destDir: string) {
  const sourceFiles = await glob(`${srcDir}/**/*.{js,ts,tsx,jsx}`);
  return await build({
    entryPoints: sourceFiles,
    minify: false,
    sourcemap: "inline",
    target: "es2015",
    bundle: false,
    format: "cjs",
    platform: "node",
    outdir: destDir,
  });
}

async function copyNonSourceFiles(srcDir: string, destDir: string) {
  const relativeDestDir = path.relative(srcDir, destDir);
  return await cpy(["**", `!**/*.{ts,js,tsx,jsx}`], relativeDestDir, {
    cwd: srcDir,
    parents: true,
  });
}

async function main() {
  const src = "src";
  const dest = "build";
  await Promise.all([
    buildSourceFiles(src, dest),
    copyNonSourceFiles(src, dest),
  ]);
}

console.time("Built in");

main()
  .then(() => {
    console.timeEnd("Built in");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
