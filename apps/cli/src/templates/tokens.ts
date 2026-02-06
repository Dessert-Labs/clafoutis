import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolves the absolute path to the starter token templates directory.
 * Works in both dev (tsx) and built (dist/) contexts.
 */
function getTokensDir(): string {
  // Dev: __dirname is src/templates/, tokens/ is adjacent
  const devPath = path.resolve(__dirname, "tokens");
  if (fs.existsSync(devPath)) return devPath;

  // Built: __dirname is dist/, templates/tokens/ is a sibling
  const distPath = path.resolve(__dirname, "templates", "tokens");
  if (fs.existsSync(distPath)) return distPath;

  throw new Error(
    `Starter token templates not found. Searched:\n  ${devPath}\n  ${distPath}`,
  );
}

/**
 * Recursively walks a directory and collects all .json files
 * with their relative paths and raw content.
 */
function walkTokensDir(
  dir: string,
  base = "",
): Array<{ path: string; content: string }> {
  const result: Array<{ path: string; content: string }> = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relPath = base ? path.join(base, entry.name) : entry.name;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...walkTokensDir(fullPath, relPath));
    } else if (entry.name.endsWith(".json")) {
      result.push({
        path: relPath,
        content: fs.readFileSync(fullPath, "utf-8"),
      });
    }
  }
  return result;
}

/**
 * Returns the JSON content for a starter token file.
 * @throws Error if fileName is not found in the templates directory.
 */
export function getStarterTokenContent(fileName: string): string {
  const tokensDir = getTokensDir();
  const filePath = path.resolve(tokensDir, fileName);

  // Guard against path traversal — filePath must remain inside tokensDir
  const relative = path.relative(tokensDir, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Invalid token file path: ${fileName}`);
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Unknown starter token file: ${fileName}`);
  }
  return fs.readFileSync(filePath, "utf-8");
}

/**
 * Returns all starter token files with their paths and JSON content.
 * Used during producer init to create the initial token structure.
 */
export function getAllStarterTokens(): Array<{
  path: string;
  content: string;
}> {
  const tokensDir = getTokensDir();
  return walkTokensDir(tokensDir);
}
