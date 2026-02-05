import type { Options } from 'tsup';
import { defineConfig } from 'tsup';

const baseOptions: Partial<Options> = {
  format: ['esm'],
  sourcemap: true,
  clean: true,
  target: 'es2022',
  treeshake: true,
  splitting: false,
  skipNodeModulesBundle: true,
  outDir: 'dist',
};

function withDefaults(option: Options): Options {
  return {
    ...baseOptions,
    dts: option.dts ?? true,
    ...option,
  };
}

export function definePackageConfig(options: Options | Options[]) {
  if (Array.isArray(options)) {
    return defineConfig(options.map(withDefaults));
  }

  return defineConfig(withDefaults(options));
}

export { defineConfig } from 'tsup';
