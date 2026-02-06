import type { DTCGToken, DTCGTokenFile, TokenDiff } from "../types/tokens";

function isToken(value: unknown): value is DTCGToken {
  return (
    typeof value === "object" &&
    value !== null &&
    "$type" in value &&
    "$value" in value
  );
}

function flattenTokens(
  obj: DTCGTokenFile,
  prefix = "",
): Map<string, DTCGToken> {
  const results = new Map<string, DTCGToken>();
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isToken(value)) {
      results.set(path, value);
    } else if (typeof value === "object" && value !== null) {
      for (const [p, t] of flattenTokens(value as DTCGTokenFile, path)) {
        results.set(p, t);
      }
    }
  }
  return results;
}

/** Computes the diff between a baseline and current set of token files. */
export function computeDiff(
  baseline: Map<string, DTCGTokenFile>,
  current: Map<string, DTCGTokenFile>,
): TokenDiff[] {
  const diffs: TokenDiff[] = [];

  const baseFlat = new Map<string, unknown>();
  for (const [, file] of baseline) {
    for (const [path, token] of flattenTokens(file)) {
      baseFlat.set(path, token.$value);
    }
  }

  const currentFlat = new Map<string, unknown>();
  for (const [, file] of current) {
    for (const [path, token] of flattenTokens(file)) {
      currentFlat.set(path, token.$value);
    }
  }

  for (const [path, value] of currentFlat) {
    if (!baseFlat.has(path)) {
      diffs.push({ path, type: "added", after: value });
    } else if (JSON.stringify(value) !== JSON.stringify(baseFlat.get(path))) {
      diffs.push({
        path,
        type: "modified",
        before: baseFlat.get(path),
        after: value,
      });
    }
  }

  for (const [path, value] of baseFlat) {
    if (!currentFlat.has(path)) {
      diffs.push({ path, type: "removed", before: value });
    }
  }

  return diffs;
}
