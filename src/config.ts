import type { Plugin } from 'esbuild'

export type Config = Partial<{
  outDir: string;
  tsConfigFile?: string;
  esbuild: {
    entryPoints?: string[];
    minify?: boolean;
    target?: string;
    plugins?: Plugin[]
  };
  assets: {
    baseDir?: string;
    filePatterns?: string[];
  };
}>;

export async function readUserConfig(configPath: string): Promise<Config> {
  try {
    return require(configPath);
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      console.error(err);
    }
    console.log('Using default config');
  }
  return {};
}
