import { definePackageConfig } from '@clafoutis/tsup-config';

export default definePackageConfig({
  entry: {
    index: 'src/index.ts',
    'tailwind/tailwindGenerator': 'src/tailwind/tailwindGenerator.ts',
    'figma/figmaGenerator': 'src/figma/figmaGenerator.ts',
  },
});
