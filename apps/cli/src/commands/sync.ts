import { logger } from '@clafoutis/shared';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

import { offerWizard } from '../cli/wizard.js';
import type { ClafoutisConfig } from '../types.js';
import { readCache, writeCache } from '../utils/cache.js';
import { fileExists, readConfig } from '../utils/config.js';
import { ClafoutisError, configNotFoundError } from '../utils/errors.js';
import { downloadRelease } from '../utils/github.js';
import { validateConsumerConfig } from '../utils/validate.js';
import { initCommand } from './init.js';

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
    const configPath = config.files[assetName];
    if (!configPath) continue;

    const outputPath = path.resolve(process.cwd(), configPath);

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

  let config = await readConfig(configPath);
  if (!config) {
    if (await fileExists(configPath)) {
      throw new ClafoutisError(
        'Invalid configuration',
        `Could not parse ${configPath}`,
        'Ensure the file contains valid JSON'
      );
    }

    if (process.stdin.isTTY) {
      const shouldRunWizard = await offerWizard('consumer');
      if (shouldRunWizard) {
        await initCommand({ consumer: true });
        config = await readConfig(configPath);
        if (!config) {
          throw configNotFoundError(configPath, true);
        }
      } else {
        throw configNotFoundError(configPath, true);
      }
    } else {
      throw configNotFoundError(configPath, true);
    }
  }

  validateConsumerConfig(config);

  const cachedVersion = await readCache();
  const isLatest = config.version === 'latest';

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

  const resolveOutputPaths = () =>
    Object.values(config.files).map(p => path.resolve(process.cwd(), p));

  if (!isLatest && !options.force && config.version === cachedVersion) {
    const outputPaths = resolveOutputPaths();
    const existsResults = await Promise.all(
      outputPaths.map(p => fileExists(p))
    );
    const allOutputsExist = existsResults.every(exists => exists);
    if (allOutputsExist) {
      logger.success(`Already at ${config.version} - no sync needed`);
      return;
    }
  }

  logger.warn(`Syncing ${config.version}...`);

  const { files, resolvedTag } = await downloadRelease(config);

  // For "latest", check if we already have this resolved version cached
  if (isLatest && !options.force && resolvedTag === cachedVersion) {
    const outputPaths = resolveOutputPaths();
    const existsResults = await Promise.all(
      outputPaths.map(p => fileExists(p))
    );
    const allOutputsExist = existsResults.every(exists => exists);
    if (allOutputsExist) {
      logger.success(`Already at ${resolvedTag} (latest) - no sync needed`);
      return;
    }
  }

  await writeOutput(config, files);

  // Cache the resolved tag, not "latest"
  await writeCache(resolvedTag);

  logger.success(`Synced to ${resolvedTag}`);

  if (config.postSync) {
    await runPostSync(config.postSync);
  }
}

/**
 * Executes the postSync command safely using shell spawn.
 * Awaits completion and handles errors with proper logging of stdout/stderr.
 * Uses the system shell to parse the command string, which is necessary
 * for commands like "npx prettier --write ./src/styles/base.css".
 *
 * @param command - The shell command string to execute
 * @throws ClafoutisError if the command fails or exits with non-zero code
 */
async function runPostSync(command: string): Promise<void> {
  logger.info(`Running postSync: ${command}`);

  // Determine the shell based on platform
  const isWindows = process.platform === 'win32';
  const shell = isWindows ? 'cmd.exe' : '/bin/sh';
  const shellArgs = isWindows ? ['/c', command] : ['-c', command];

  return new Promise((resolve, reject) => {
    const child = spawn(shell, shellArgs, {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: process.env,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('error', (err: Error) => {
      reject(
        new ClafoutisError(
          'postSync failed',
          `Failed to spawn command: ${err.message}`,
          'Check that the command is valid and executable'
        )
      );
    });

    child.on('close', (code: number | null) => {
      if (code === 0) {
        if (stdout.trim()) {
          logger.info(stdout.trim());
        }
        logger.success('postSync completed');
        resolve();
      } else {
        const output = [stdout, stderr].filter(Boolean).join('\n').trim();
        logger.error(`postSync output:\n${output || '(no output)'}`);
        reject(
          new ClafoutisError(
            'postSync failed',
            `Command exited with code ${code}`,
            'Review the command output above and fix any issues'
          )
        );
      }
    });
  });
}
