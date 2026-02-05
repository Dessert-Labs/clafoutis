import { definePackageConfig } from '@clafoutis/tsup-config';

export default definePackageConfig([
  {
    entry: { index: 'src/index.ts' },
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  {
    entry: { types: 'src/types.ts' },
  },
]);
