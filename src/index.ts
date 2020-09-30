#!/usr/bin/env node

import ts, { BuildOptions } from "typescript";
import { build } from "esbuild";
import cpy from "cpy";
import path from "path";
import rimraf from "rimraf";
import { Config, readUserConfig } from "./config";

const cwd = process.cwd();

function getTSConfig() {
  const tsConfigFile = ts.findConfigFile(
    cwd,
    ts.sys.fileExists,
    "tsconfig.json"
  );
  if (!tsConfigFile) {
    throw new Error(`tsconfig.json not found in the current directory! ${cwd}`);
  }
  const configFile = ts.readConfigFile(tsConfigFile, ts.sys.readFile);
  const tsConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    cwd
  );
  return { tsConfig, tsConfigFile };
}

type TSConfig = ReturnType<typeof getTSConfig>["tsConfig"];

function esBuildSourceMapOptions(tsConfig: TSConfig) {
  if (!tsConfig.options.sourceMap) {
    return false;
  }
  return tsConfig.options.inlineSourceMap ? "inline" : "external";
}

function getBuildMetadata(userConfig: Config) {
  const { tsConfig, tsConfigFile } = getTSConfig();

  const outDir = tsConfig.options.outDir || userConfig.outDir || "dist";

  const esbuildEntryPoints = userConfig.esbuild?.entryPoints || [];
  const srcFiles = [...tsConfig.fileNames, ...esbuildEntryPoints];
  const sourcemap = esBuildSourceMapOptions(tsConfig);
  const target =
    userConfig.esbuild?.target ||
    tsConfig?.raw?.compilerOptions?.target ||
    "es6";

  const minify = userConfig.esbuild?.minify || false;

  const esbuildOptions: BuildOptions = {
    outdir: outDir,
    entryPoints: srcFiles,
    sourcemap,
    target,
    minify,
    tsconfig: tsConfigFile,
  };

  const assetPatterns = userConfig.assets?.filePatterns || ["**"];

  const assetsOptions = {
    baseDir: userConfig.assets?.baseDir || "src",
    outDir: outDir,
    patterns: [...assetPatterns, `!**/*.{ts,js,tsx,jsx}`],
  };

  return { outDir, esbuildOptions, assetsOptions };
}

async function buildSourceFiles(esbuildOptions: Partial<BuildOptions>) {
  return await build({
    ...esbuildOptions,
    format: "cjs",
    platform: "node",
  });
}

type AssetsOptions = { baseDir: string; outDir: string; patterns: string[] };

async function copyNonSourceFiles({
  baseDir,
  outDir,
  patterns,
}: AssetsOptions) {
  const relativeOutDir = path.relative(baseDir, outDir);
  return await cpy(patterns, relativeOutDir, {
    cwd: baseDir,
    parents: true,
  });
}

async function main() {
  const config = await readUserConfig(path.resolve(cwd, "etsc.config.js"));

  const { outDir, esbuildOptions, assetsOptions } = getBuildMetadata(config);

  rimraf.sync(outDir);

  await Promise.all([
    buildSourceFiles(esbuildOptions),
    copyNonSourceFiles(assetsOptions),
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
