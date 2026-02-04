import fs from 'fs/promises';

const CACHE_DIR = '.clafoutis';
const CACHE_FILE = `${CACHE_DIR}/cache`;

/**
 * Reads the cached version from .clafoutis/cache file.
 * Returns null if the cache file does not exist.
 */
export async function readCache(): Promise<string | null> {
  try {
    return (await fs.readFile(CACHE_FILE, 'utf-8')).trim();
  } catch {
    return null;
  }
}

/**
 * Writes the current version to the .clafoutis/cache file.
 * Creates the .clafoutis directory if it doesn't exist.
 */
export async function writeCache(version: string): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(CACHE_FILE, version);
}
