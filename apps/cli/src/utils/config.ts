import fs from 'fs/promises';

import type { ClafoutisConfig, ProducerConfig } from '../types.js';

/**
 * Reads and parses a consumer configuration file (.clafoutis.json).
 * Returns null if the file does not exist or cannot be parsed.
 */
export async function readConfig(
  configPath: string
): Promise<ClafoutisConfig | null> {
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content) as ClafoutisConfig;
  } catch {
    return null;
  }
}

/**
 * Reads and parses a producer configuration file (clafoutis.config.json).
 * Returns null if the file does not exist or cannot be parsed.
 */
export async function readProducerConfig(
  configPath: string
): Promise<ProducerConfig | null> {
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content) as ProducerConfig;
  } catch {
    return null;
  }
}

/**
 * Checks if a file exists at the given path.
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
