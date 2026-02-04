#!/usr/bin/env node
import { Command } from 'commander';

import { generateCommand } from './commands/generate.js';
import { initCommand } from './commands/init.js';
import { syncCommand } from './commands/sync.js';
import { ClafoutisError } from './utils/errors.js';

const program = new Command();

/**
 * Wraps a command action with error handling for ClafoutisError instances.
 */
function withErrorHandling<T>(
  fn: (options: T) => Promise<void>
): (options: T) => Promise<void> {
  return async (options: T): Promise<void> => {
    try {
      await fn(options);
    } catch (err) {
      if (err instanceof ClafoutisError) {
        console.error(err.format());
        process.exit(1);
      }
      throw err;
    }
  };
}

process.on('uncaughtException', err => {
  if (err instanceof ClafoutisError) {
    console.error(err.format());
  } else {
    console.error(`\nUnexpected error: ${err.message}\n`);
    console.error(
      'Please report this issue at: https://github.com/Dessert-Labs/clafoutis/issues'
    );
  }
  process.exit(1);
});

program
  .name('clafoutis')
  .description('GitOps powered design system - generate and sync design tokens')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate platform outputs from design tokens (for producers)')
  .option(
    '-c, --config <path>',
    'Path to config file',
    '.clafoutis/producer.json'
  )
  .option('--tailwind', 'Generate Tailwind output')
  .option('--figma', 'Generate Figma variables')
  .option('-o, --output <dir>', 'Output directory', './build')
  .option('--dry-run', 'Preview changes without writing files')
  .action(withErrorHandling(generateCommand));

program
  .command('sync')
  .description('Sync design tokens from GitHub Release (for consumers)')
  .option('-f, --force', 'Force sync even if versions match')
  .option(
    '-c, --config <path>',
    'Path to config file',
    '.clafoutis/consumer.json'
  )
  .option('--dry-run', 'Preview changes without writing files')
  .action(withErrorHandling(syncCommand));

program
  .command('init')
  .description('Initialize Clafoutis configuration')
  .option('--producer', 'Set up as a design token producer')
  .option('--consumer', 'Set up as a design token consumer')
  .option('-r, --repo <repo>', 'GitHub repo for consumer mode (org/name)')
  .action(withErrorHandling(initCommand));

program.parse();
