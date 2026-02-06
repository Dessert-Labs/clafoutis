import clafoutisConfig from '@clafoutis/eslint-config';

export default [
  ...clafoutisConfig,
  {
    ignores: ['.tanstack/**', 'src/generated/**'],
  },
];
