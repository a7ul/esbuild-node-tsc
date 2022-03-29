import fs from 'fs'
import type { Plugin } from "esbuild";

export type Config = Partial<{
  outDir: string;
  clean?: boolean;
  tsConfigFile?: string;
  esbuild: {
    entryPoints?: string[];
    minify?: boolean;
    target?: string;
    plugins?: Plugin[];
    format?: "cjs" | "esm";
  };
  assets: {
    baseDir?: string;
    outDir?: string;
    filePatterns?: string[];
  };
}>;

export async function readUserConfig(configPath: string): Promise<Config> {
  if (fs.existsSync(configPath)) {
    try {
      return require(configPath);
    }
    catch (e) {
      console.log("Config file has some errors:");
      console.error(e);
    }
  }
  console.log("Using default config");
  return {};
}
