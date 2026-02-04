import { logger } from '@clafoutis/shared';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

import type { ClafoutisConfig } from '../types.js';
import { readCache, writeCache } from '../utils/cache.js';
import { fileExists, readConfig } from '../utils/config.js';
import { ClafoutisError, configNotFoundError } from '../utils/errors.js';
import { downloadRelease } from '../utils/github.js';
import { validateConsumerConfig } from '../utils/validate.js';

interface SyncOptions {
  force?: boolean;
  config?: string;
  dryRun?: boolean;
}

/**
 * Writes downloaded files to the configured output paths.
 */
async function writeOutput(
  config: ClafoutisConfig,
  files: Map<string, string>
): Promise<void> {
  for (const [assetName, content] of files) {
    const outputPath = config.files[assetName];
    if (!outputPath) continue;

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, content);
    logger.success(`Written: ${outputPath}`);
  }
}

/**
 * Main sync command handler.
 * Downloads design tokens from a GitHub release and writes them to configured paths.
 */
export async function syncCommand(options: SyncOptions): Promise<void> {
  const configPath = options.config || '.clafoutis/consumer.json';

  const config = await readConfig(configPath);
  if (!config) {
    if (await fileExists(configPath)) {
      throw new ClafoutisError(
        'Invalid configuration',
        `Could not parse ${configPath}`,
        'Ensure the file contains valid JSON'
      );
    }
    throw configNotFoundError(configPath, true);
  }

  validateConsumerConfig(config);

  const cachedVersion = await readCache();

  logger.info(`Repo: ${config.repo}`);
  logger.info(`Pinned: ${config.version}`);
  logger.info(`Cached: ${cachedVersion || 'none'}`);

  if (options.dryRun) {
    logger.info(
      '[dry-run] Would download from: ' + config.repo + ' ' + config.version
    );
    for (const [assetName, outputPath] of Object.entries(config.files)) {
      logger.info(`[dry-run] ${assetName} → ${outputPath}`);
    }
    return;
  }

  if (!options.force && config.version === cachedVersion) {
    const firstOutputPath = Object.values(config.files)[0];
    const outputExists = firstOutputPath && (await fileExists(firstOutputPath));
    if (outputExists) {
      logger.success(`Already at ${config.version} - no sync needed`);
      return;
    }
  }

  logger.warn(`Syncing ${config.version}...`);

  const files = await downloadRelease(config);

  await writeOutput(config, files);

  await writeCache(config.version);

  logger.success(`Synced to ${config.version}`);

  if (config.postSync) {
    logger.info(`Running: ${config.postSync}`);
    exec(config.postSync);
  }
}
