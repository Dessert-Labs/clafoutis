import type {
  DTCGToken,
  DTCGTokenFile,
  ValidationResult,
} from "../types/tokens";

const REFERENCE_PATTERN = /^\{([^}]+)\}$/;
const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const DIMENSION_PATTERN = /^(?:\d+|\d*\.\d+)(px|rem|em|%|pt|vw|vh)?$/;

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
): { path: string; token: DTCGToken }[] {
  const results: { path: string; token: DTCGToken }[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isToken(value)) {
      results.push({ path, token: value });
    } else if (typeof value === "object" && value !== null) {
      results.push(...flattenTokens(value as DTCGTokenFile, path));
    }
  }
  return results;
}

function getReference(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const match = value.match(REFERENCE_PATTERN);
  return match ? match[1] : undefined;
}

function validateColorValue(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return HEX_PATTERN.test(value);
}

function validateDimensionValue(value: unknown): boolean {
  if (typeof value === "number") return true;
  if (typeof value !== "string") return false;
  return DIMENSION_PATTERN.test(value);
}

function validateFontWeight(value: unknown): boolean {
  if (typeof value === "number") return value >= 1 && value <= 1000;
  if (typeof value === "string") {
    const num = parseInt(value, 10);
    return !isNaN(num) && num >= 1 && num <= 1000;
  }
  return false;
}

/** Validates all tokens in the given file set and returns any issues found. */
export function validateTokens(
  tokenFiles: Map<string, DTCGTokenFile>,
): ValidationResult[] {
  const results: ValidationResult[] = [];
  const allPaths = new Set<string>();
  const pathCounts = new Map<string, number>();

  const allTokens: { path: string; token: DTCGToken; filePath: string }[] = [];
  for (const [filePath, file] of tokenFiles) {
    for (const { path, token } of flattenTokens(file)) {
      allTokens.push({ path, token, filePath });
      allPaths.add(path);
      pathCounts.set(path, (pathCounts.get(path) || 0) + 1);
    }
  }

  for (const [path, count] of pathCounts) {
    if (count > 1) {
      results.push({
        path,
        severity: "error",
        message: `Duplicate token path "${path}" defined in ${count} files`,
        code: "DUPLICATE_PATH",
      });
    }
  }

  for (const { path, token } of allTokens) {
    const ref = getReference(token.$value);

    if (ref) {
      if (!allPaths.has(ref)) {
        results.push({
          path,
          severity: "error",
          message: `Broken reference: "{${ref}}" does not exist`,
          code: "BROKEN_REF",
        });
      }
      continue;
    }

    switch (token.$type) {
      case "color":
        if (!validateColorValue(token.$value)) {
          results.push({
            path,
            severity: "error",
            message: `Invalid color value: "${String(token.$value)}"`,
            code: "INVALID_VALUE",
          });
        }
        break;

      case "dimension":
        if (!validateDimensionValue(token.$value)) {
          results.push({
            path,
            severity: "error",
            message: `Invalid dimension value: "${String(token.$value)}"`,
            code: "INVALID_VALUE",
          });
        }
        break;

      case "fontWeight":
        if (!validateFontWeight(token.$value)) {
          results.push({
            path,
            severity: "warning",
            message: `Invalid font weight: "${String(token.$value)}"`,
            code: "INVALID_VALUE",
          });
        }
        break;
    }
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  const detectCycle = (path: string, chain: string[]): void => {
    if (inStack.has(path)) {
      const cycleStart = chain.indexOf(path);
      const cycle = chain.slice(cycleStart);
      results.push({
        path: cycle[0],
        severity: "error",
        message: `Circular reference: ${cycle.join(" -> ")} -> ${path}`,
        code: "CIRCULAR_REF",
      });
      return;
    }
    if (visited.has(path)) return;
    inStack.add(path);
    chain.push(path);

    const token = allTokens.find((t) => t.path === path);
    if (token) {
      const ref = getReference(token.token.$value);
      if (ref) {
        detectCycle(ref, [...chain]);
      }
    }

    inStack.delete(path);
    visited.add(path);
  };

  for (const { path } of allTokens) {
    detectCycle(path, []);
  }

  return results;
}
