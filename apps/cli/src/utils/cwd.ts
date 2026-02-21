import path from "path";

import { ClafoutisError } from "./errors";

/**
 * Resolves the effective command working directory.
 * Uses process.cwd() when no --cwd override is provided.
 */
export function resolveCommandCwd(cwdOverride?: string): string {
  const cwd = cwdOverride?.trim() ? cwdOverride : process.cwd();
  return path.resolve(cwd);
}

/**
 * Resolves a path against command cwd when relative.
 */
export function resolveInCwd(commandCwd: string, targetPath: string): string {
  return path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : path.resolve(commandCwd, targetPath);
}

/**
 * Converts an absolute path to a cwd-relative display path when possible.
 */
export function displayPath(commandCwd: string, absolutePath: string): string {
  const rel = path.relative(commandCwd, absolutePath);
  return rel && !rel.startsWith("..") ? rel : absolutePath;
}

/**
 * Ensures cwd override is not empty whitespace when provided.
 */
export function validateCwdOption(cwdOverride?: string): void {
  if (cwdOverride !== undefined && cwdOverride.trim() === "") {
    throw new ClafoutisError(
      "Invalid --cwd value",
      "--cwd cannot be empty",
      "Provide a valid directory path, for example: --cwd ./packages/design-system",
    );
  }
}
