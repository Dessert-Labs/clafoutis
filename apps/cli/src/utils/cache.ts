import fs from "fs/promises";
import path from "path";

const CACHE_DIR = ".clafoutis";
const CACHE_FILE = "cache";

function getCachePaths(commandCwd: string): { dir: string; file: string } {
  const dir = path.resolve(commandCwd, CACHE_DIR);
  return {
    dir,
    file: path.join(dir, CACHE_FILE),
  };
}

/**
 * Reads the cached version from .clafoutis/cache file.
 * Returns null if the cache file does not exist.
 * Rethrows other errors (permissions, corruption, etc.).
 */
export async function readCache(
  commandCwd = process.cwd(),
): Promise<string | null> {
  const { file } = getCachePaths(commandCwd);
  try {
    return (await fs.readFile(file, "utf-8")).trim();
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return null;
    }
    throw err;
  }
}

/**
 * Writes the current version to the .clafoutis/cache file.
 * Creates the .clafoutis directory if it doesn't exist.
 */
export async function writeCache(
  version: string,
  commandCwd = process.cwd(),
): Promise<void> {
  const { dir, file } = getCachePaths(commandCwd);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, version);
}
