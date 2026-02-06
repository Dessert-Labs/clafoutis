import type { DTCGTokenFile } from "../types/tokens";

/** Exports token files back to DTCG JSON format, preserving file structure. */
export function exportTokens(
  tokenFiles: Map<string, DTCGTokenFile>,
): Record<string, DTCGTokenFile> {
  const result: Record<string, DTCGTokenFile> = {};
  for (const [filePath, file] of tokenFiles) {
    result[filePath] = JSON.parse(JSON.stringify(file));
  }
  return result;
}

/**
 * Recursively sorts object keys to ensure consistent JSON output.
 * This prevents formatting changes when files are serialized.
 */
function sortKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }

  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
  }
  return sorted;
}

/** Serializes a single token file to a formatted JSON string with consistent formatting. */
export function serializeTokenFile(file: DTCGTokenFile): string {
  const sorted = sortKeys(file) as DTCGTokenFile;
  return JSON.stringify(sorted, null, 2) + "\n";
}
