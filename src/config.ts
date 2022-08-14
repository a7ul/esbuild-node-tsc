import fs from "fs";
import type { BuildOptions as EsBuildOptions, Plugin } from "esbuild";

export type Config = Partial<{
  outDir: string;
  clean?: boolean;
  tsConfigFile?: string;
  esbuild: EsBuildOptions;
  assets: {
    baseDir?: string;
    outDir?: string;
    filePatterns?: string[];
  };
}>;

export async function readUserConfig(configPath: string): Promise<Config> {
  if (fs.existsSync(configPath)) {
    try {
      const { default: config } = await import(configPath);
      return config;
    } catch (e) {
      console.log("Config file has some errors:");
      console.error(e);
    }
  }
  console.log("Using default config");
  return {};
}
