import fs from "fs";
import type { BuildOptions as EsBuildOptions } from "esbuild";

export type Config = Partial<{
  tsConfigFile?: string;
  esbuild: EsBuildOptions;
  prebuild: () => Promise<void>;
  postbuild: () => Promise<void>;
}>;

export async function readUserConfig(configPath: string): Promise<Config> {
  if (fs.existsSync(configPath)) {
    try {
      const { default: config } = await import(configPath);
      if (config.outDir) {
        console.warn(
          "Your etsc config file is using the old v1.0 format. Please update to the new v2.0 format. Check https://github.com/a7ul/esbuild-node-tsc for details."
        );
      }
      return config;
    } catch (e) {
      console.log("Config file has some errors:");
      console.error(e);
    }
  }
  console.log("Using default config");
  return {};
}
