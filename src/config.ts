export type Config = Partial<{
  outDir: string;
  esbuild: {
    entryPoints?: string[];
    minify?: boolean;
    target?: string;
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
    // Ignore the read error
  }
  return {};
}
