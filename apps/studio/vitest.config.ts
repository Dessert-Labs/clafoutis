import { defineConfig, mergeConfig } from "vitest/config";

import baseConfig from "@clafoutis/vitest-config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/tests/storybook/**",
      ],
    },
  }),
);
