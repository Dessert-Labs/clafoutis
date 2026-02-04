import { logger } from '@clafoutis/shared';
import fs from 'fs/promises';
import path from 'path';

import { fileExists } from '../utils/config.js';
import { ClafoutisError } from '../utils/errors.js';

interface InitOptions {
  producer?: boolean;
  consumer?: boolean;
  repo?: string;
}

/**
 * Initializes a producer (design system) repository with configuration,
 * example tokens, and a GitHub Actions workflow.
 */
async function initProducer(): Promise<void> {
  const configDir = '.clafoutis';
  const configPath = `${configDir}/producer.json`;

  if (await fileExists(configPath)) {
    throw new ClafoutisError(
      'Configuration already exists',
      `${configPath} already exists`,
      'Delete the file first if you want to reinitialize'
    );
  }

  await fs.mkdir(configDir, { recursive: true });

  const config = {
    tokens: './tokens',
    output: './build',
    generators: {
      tailwind: true,
      figma: true,
    },
  };

  await fs.writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
  logger.success(`Created ${configPath}`);

  const tokensDir = './tokens';
  await fs.mkdir(path.join(tokensDir, 'colors'), { recursive: true });

  const exampleTokens = {
    color: {
      primary: {
        $type: 'color',
        $value: '#3b82f6',
      },
      secondary: {
        $type: 'color',
        $value: '#64748b',
      },
    },
  };

  await fs.writeFile(
    path.join(tokensDir, 'colors', 'primitives.json'),
    JSON.stringify(exampleTokens, null, 2) + '\n'
  );
  logger.success(`Created ${tokensDir}/colors/primitives.json`);

  await fs.mkdir('.github/workflows', { recursive: true });

  const workflow = `name: Generate and Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - run: npm install -D clafoutis

      - run: npx clafoutis generate

      - name: Get version
        id: version
        run: echo "version=$(date +%Y%m%d.%H%M%S)" >> $GITHUB_OUTPUT

      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v\${{ steps.version.outputs.version }}
          name: Design Tokens v\${{ steps.version.outputs.version }}
          generate_release_notes: true
          files: |
            build/**/*
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;

  await fs.writeFile('.github/workflows/clafoutis-release.yml', workflow);
  logger.success('Created .github/workflows/clafoutis-release.yml');

  logger.info('');
  logger.info('Next steps:');
  logger.info(
    '  1. Edit tokens/colors/primitives.json with your design tokens'
  );
  logger.info('  2. Run: npx clafoutis generate');
  logger.info('  3. Push to GitHub - releases will be created automatically');
}

/**
 * Initializes a consumer (application) repository with configuration
 * for syncing design tokens from a GitHub release.
 */
async function initConsumer(repo?: string): Promise<void> {
  const configDir = '.clafoutis';
  const configPath = `${configDir}/consumer.json`;

  if (await fileExists(configPath)) {
    throw new ClafoutisError(
      'Configuration already exists',
      `${configPath} already exists`,
      'Delete the file first if you want to reinitialize'
    );
  }

  await fs.mkdir(configDir, { recursive: true });

  const config = {
    repo: repo || 'YourOrg/design-system',
    version: 'v1.0.0',
    files: {
      'scss._colors.scss': 'src/tokens/_colors.scss',
      'scss._typography.scss': 'src/tokens/_typography.scss',
      'tailwind.config.js': './tailwind.config.js',
    },
  };

  await fs.writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
  logger.success(`Created ${configPath}`);

  logger.info('');
  logger.info('Next steps:');
  logger.info('  1. Update repo and version in .clafoutis/consumer.json');
  logger.info('  2. Set GITHUB_TOKEN environment variable (for private repos)');
  logger.info('  3. Run: npx clafoutis sync');
  logger.info('  4. Add .clafoutis/cache to .gitignore');
}

/**
 * Main init command handler.
 * Initializes either a producer or consumer repository based on options.
 */
export async function initCommand(options: InitOptions): Promise<void> {
  const isProducer = options.producer && !options.consumer;

  if (isProducer) {
    await initProducer();
  } else {
    await initConsumer(options.repo);
  }
}
