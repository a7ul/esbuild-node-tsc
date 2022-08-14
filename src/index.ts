#!/usr/bin/env node

import ts from "typescript";
import { build, BuildOptions as EsBuildOptions } from "esbuild";
import cpy from "cpy";
import path from "path";
import rimraf from "rimraf";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { Config, readUserConfig } from "./config.js";

const cwd = process.cwd();
const { argv } = yargs(hideBin(process.argv))
  .option("config", {
    describe: "path to config file",
    type: "string",
  })
  .option("clean", {
    describe: "clean output directory before build",
    type: "boolean",
  });

function getTSConfig(_tsConfigFile = "tsconfig.json") {
  const tsConfigFile = ts.findConfigFile(cwd, ts.sys.fileExists, _tsConfigFile);
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
  const { sourceMap, inlineSources, inlineSourceMap } = tsConfig.options;

  // inlineSources requires either inlineSourceMap or sourceMap
  if (inlineSources && !inlineSourceMap && !sourceMap) {
    return false;
  }

  // Mutually exclusive in tsconfig
  if (sourceMap && inlineSourceMap) {
    return false;
  }

  if (inlineSourceMap) {
    return "inline";
  }

  return sourceMap;
}

function getBuildMetadata(userConfig: Config) {
  const { tsConfig, tsConfigFile } = getTSConfig(userConfig.tsConfigFile);
  const esbuildConfig = userConfig.esbuild || {};

  const outDir =
    userConfig.outDir ||
    tsConfig.options.outDir ||
    esbuildConfig.outdir ||
    "dist";

  const srcFiles = [
    ...tsConfig.fileNames,
    ...((esbuildConfig.entryPoints as string[]) ?? []),
  ];
  const sourcemap =
    esBuildSourceMapOptions(tsConfig) || userConfig.esbuild?.sourcemap;
  const target =
    tsConfig?.raw?.compilerOptions?.target || esbuildConfig?.target || "es2015";
  const format = esbuildConfig?.format || "cjs";

  const esbuildOptions: EsBuildOptions = {
    ...userConfig.esbuild,
    outdir: outDir,
    entryPoints: srcFiles,
    sourcemap,
    target,
    tsconfig: tsConfigFile,
    format,
  };

  const assetPatterns = userConfig.assets?.filePatterns || ["**"];

  const assetsOptions = {
    baseDir: userConfig.assets?.baseDir || "src",
    outDir: userConfig.assets?.outDir || outDir,
    patterns: [...assetPatterns, "!**/*.{ts,js,tsx,jsx}"],
  };

  return { outDir, esbuildOptions, assetsOptions };
}

async function buildSourceFiles(esbuildOptions: EsBuildOptions) {
  return await build({
    bundle: false,
    format: "cjs",
    platform: "node",
    ...esbuildOptions,
  });
}

type AssetsOptions = { baseDir: string; outDir: string; patterns: string[] };

async function copyNonSourceFiles({
  baseDir,
  outDir,
  patterns,
}: AssetsOptions) {
  const relativeOutDir = path.relative(baseDir, outDir);
  return await cpy(patterns, relativeOutDir, { cwd: baseDir });
}

async function main() {
  const configFilename = <string>(await argv)?.config || "etsc.config.js";
  const clean = (await argv)?.clean;
  const config = await readUserConfig(path.resolve(cwd, configFilename));

  const { outDir, esbuildOptions, assetsOptions } = getBuildMetadata(config);

  if (clean) {
    rimraf.sync(outDir);
  }

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
