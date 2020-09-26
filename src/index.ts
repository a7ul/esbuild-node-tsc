#!/usr/bin/env node

import { build, BuildOptions } from "esbuild";
import glob from "globby";
import cpy from "cpy";
import path from "path";
//@ts-ignore
import rimraf from "rimraf";

const cwd = process.cwd();

const config: {
  src: string;
  dest: string;
  esbuild: BuildOptions;
  assets: {
    files: string[];
  };
} = {
  src: "src",
  dest: "dist",
  esbuild: {
    entryPoints: ["**/*.{js,ts,tsx,jsx}"],
    minify: false,
    sourcemap: "inline",
    target: "es2015",
    bundle: false,
    format: "cjs",
    platform: "node",
    tsconfig: "./tsconfig.json",
  },
  assets: {
    files: ["**", `!**/*.{ts,js,tsx,jsx}`],
  },
};

async function buildSourceFiles(srcDir: string, destDir: string) {
  const esbuildOptions = {
    ...config.esbuild,
    entryPoints: await glob(
      config.esbuild.entryPoints?.map((p) => path.resolve(srcDir, p)) || []
    ),
    outdir: destDir,
  };
  return await build(esbuildOptions);
}

async function copyNonSourceFiles(srcDir: string, destDir: string) {
  const relativeDestDir = path.relative(srcDir, destDir);
  return await cpy(["**", `!**/*.{ts,js,tsx,jsx}`], relativeDestDir, {
    cwd: srcDir,
    parents: true,
  });
}

async function main() {
  const src = config.src;
  const dest = config.dest;
  rimraf.sync(dest);
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
