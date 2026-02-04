import baseConfig from '@clafoutis/vitest-config';
import { mergeConfig } from 'vitest/config';

export default mergeConfig(baseConfig, {
  test: {
    include: ['src/**/*.test.ts'],
  },
});
