#!/usr/bin/env node

import ts from "typescript";
import { build } from "esbuild";
import path from "path";
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

function getEsbuildMetadata(userConfig: Config) {
  const { tsConfig, tsConfigFile } = getTSConfig(userConfig.tsConfigFile);
  const esbuildConfig = userConfig.esbuild || {};

  const outdir = tsConfig.options.outDir || esbuildConfig.outdir || "dist";
  const srcFiles = [
    ...tsConfig.fileNames,
    ...((esbuildConfig.entryPoints as string[]) ?? []),
  ];
  const sourcemap =
    esBuildSourceMapOptions(tsConfig) || userConfig.esbuild?.sourcemap;
  const target: string =
    tsConfig?.raw?.compilerOptions?.target || esbuildConfig?.target || "es2015";

  const esbuildOptions = {
    ...userConfig.esbuild,
    outdir,
    entryPoints: srcFiles,
    sourcemap,
    target: target.toLowerCase(),
    tsconfig: tsConfigFile,
  };

  return { esbuildOptions };
}

async function main() {
  const configFilename = <string>(await argv)?.config || "etsc.config.js";
  const config = await readUserConfig(path.resolve(cwd, configFilename));

  const { esbuildOptions } = getEsbuildMetadata(config);

  if (config.prebuild) {
    await config.prebuild();
  }

  await build({
    bundle: false,
    format: "cjs",
    platform: "node",
    ...esbuildOptions,
  });

  if (config.postbuild) {
    await config.postbuild();
  }
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
