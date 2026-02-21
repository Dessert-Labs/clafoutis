import fs from "node:fs";
import path from "node:path";

import { logger } from "@clafoutis/shared";

import {
  resolveCommandCwd,
  resolveInCwd,
  validateCwdOption,
} from "../utils/cwd";
import { tokensDirNotFoundError } from "../utils/errors";

interface FormatOptions {
  tokens?: string;
  check?: boolean;
  dryRun?: boolean;
  cwd?: string;
}

/**
 * Recursively loads all JSON token files from a directory.
 */
function loadTokenFiles(
  dirPath: string,
): Array<{ relativePath: string; fullPath: string; content: string }> {
  const files: Array<{
    relativePath: string;
    fullPath: string;
    content: string;
  }> = [];

  function walk(dir: string, prefix: string): void {
    if (!fs.existsSync(dir)) {
      return;
    }

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        walk(fullPath, relativePath);
      } else if (entry.name.endsWith(".json")) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          files.push({ relativePath, fullPath, content });
        } catch (err) {
          logger.warn(
            `Failed to read ${relativePath}: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
      }
    }
  }

  walk(dirPath, "");
  return files;
}

/**
 * Formats a JSON string to match serializeTokenFile output:
 * JSON.stringify(parsed, null, 2) + "\n"
 *
 * This is the single canonical format used everywhere —
 * Studio's serializeTokenFile and this CLI command produce identical output.
 */
function formatJson(content: string): string {
  const parsed = JSON.parse(content);
  return JSON.stringify(parsed, null, 2) + "\n";
}

/**
 * Formats token files to ensure consistent JSON formatting.
 */
export function formatCommand(options: FormatOptions): void {
  validateCwdOption(options.cwd);
  const commandCwd = resolveCommandCwd(options.cwd);
  const tokensDir = resolveInCwd(commandCwd, options.tokens || "./tokens");

  if (!fs.existsSync(tokensDir)) {
    throw tokensDirNotFoundError(tokensDir);
  }

  logger.info(`Formatting token files in ${tokensDir}...`);

  const files = loadTokenFiles(tokensDir);
  const fileCount = files.length;

  if (fileCount === 0) {
    logger.warn(`No JSON files found in ${tokensDir}`);
    return;
  }

  let changedCount = 0;
  const unformattedFiles: string[] = [];

  for (const { relativePath, fullPath, content } of files) {
    try {
      const formatted = formatJson(content);

      if (content !== formatted) {
        if (options.check) {
          unformattedFiles.push(relativePath);
          changedCount++;
        } else if (options.dryRun) {
          logger.info(`Would format: ${relativePath}`);
          changedCount++;
        } else {
          fs.writeFileSync(fullPath, formatted, "utf-8");
          logger.info(`Formatted: ${relativePath}`);
          changedCount++;
        }
      }
    } catch (err) {
      logger.error(
        `Failed to format ${relativePath}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      throw err;
    }
  }

  if (options.check) {
    if (changedCount > 0) {
      logger.error(
        `${changedCount} of ${fileCount} files are not formatted correctly:`,
      );
      for (const file of unformattedFiles) {
        logger.error(`  - ${file}`);
      }
      logger.info(
        `Run 'npx clafoutis format --tokens ${tokensDir}' to fix formatting.`,
      );
      process.exit(1);
    }
    logger.success(`All ${fileCount} files are correctly formatted`);
    return;
  }

  if (options.dryRun) {
    if (changedCount > 0) {
      logger.info(`Would format ${changedCount} of ${fileCount} files`);
    } else {
      logger.info(`All ${fileCount} files are already formatted`);
    }
    return;
  }

  if (changedCount > 0) {
    logger.success(`Formatted ${changedCount} of ${fileCount} files`);
  } else {
    logger.success(`All ${fileCount} files are already formatted`);
  }
}
