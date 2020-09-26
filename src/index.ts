#!/usr/bin/env node
import ts, { BuildOptions } from "typescript";
import { build } from "esbuild";
import cpy from "cpy";
import path from "path";
//@ts-ignore
import rimraf from "rimraf";

const config: Config = {
  outDir: "dist",
  esbuild: {
    entryPoints: [] as string[],
    minify: false,
    target: "es2015",
  },
  assets: {
    baseDir: "src",
    filePatterns: ["**", `!**/*.{ts,js,tsx,jsx}`],
  },
};

type Config = {
  outDir?: string;
  esbuild?: {
    entryPoints?: string[];
    minify?: boolean;
    target?: string;
  };
  assets?: {
    baseDir?: string;
    filePatterns?: string[];
  };
};

function getTSConfig() {
  const tsConfigFile = ts.findConfigFile(
    process.cwd(),
    ts.sys.fileExists,
    "tsconfig.json"
  );
  const configFile = ts.readConfigFile(tsConfigFile!, ts.sys.readFile);
  const tsConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    process.cwd()
  );
  return { tsConfig, tsConfigFile };
}

type TSConfig = ReturnType<typeof getTSConfig>["tsConfig"];

function esBuildSourceMapOptions(tsConfig: TSConfig) {
  let sourcemap = tsConfig.options.sourceMap;
  if (!sourcemap) {
    return false;
  }
  if (tsConfig.options.inlineSourceMap) {
    return "inline";
  }
  return "external";
}

async function buildSourceFiles(esbuildOptions: Partial<BuildOptions>) {
  return await build({
    ...esbuildOptions,
    bundle: false,
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

function getBuildMetadata(userConfig: Config) {
  const { tsConfig, tsConfigFile } = getTSConfig();

  const outDir = tsConfig.options.outDir || config.outDir || "dist";

  const esbuildEntryPoints = userConfig.esbuild?.entryPoints || [];
  const srcFiles = [...tsConfig.fileNames, ...esbuildEntryPoints];
  const sourcemap = esBuildSourceMapOptions(tsConfig);
  const target =
    config.esbuild?.target || tsConfig?.raw?.compilerOptions?.target || "es6";
  const minify = config.esbuild?.minify || false;

  const esbuildOptions: BuildOptions = {
    outdir: outDir,
    entryPoints: srcFiles,
    sourcemap,
    target,
    minify,
    tsconfig: tsConfigFile,
  };

  const assetsOptions = {
    baseDir: userConfig.assets?.baseDir || "src",
    outDir: outDir,
    patterns: userConfig.assets?.filePatterns || [
      "**",
      `!**/*.{ts,js,tsx,jsx}`,
    ],
  };

  return { outDir, esbuildOptions, assetsOptions };
}

async function main() {
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
