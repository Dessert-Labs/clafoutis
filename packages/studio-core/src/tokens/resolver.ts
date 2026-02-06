import type { DTCGToken, DTCGTokenFile, ResolvedToken } from "../types/tokens";

const REFERENCE_PATTERN = /^\{([^}]+)\}$/;

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
  filePath: string,
  prefix = "",
): { path: string; token: DTCGToken; filePath: string }[] {
  const results: { path: string; token: DTCGToken; filePath: string }[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    if (isToken(value)) {
      results.push({ path: currentPath, token: value, filePath });
    } else if (typeof value === "object" && value !== null) {
      results.push(
        ...flattenTokens(value as DTCGTokenFile, filePath, currentPath),
      );
    }
  }
  return results;
}

function getReference(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const match = value.match(REFERENCE_PATTERN);
  return match ? match[1] : undefined;
}

export class TokenResolver {
  private tokenMap = new Map<string, DTCGToken>();
  private pathToFile = new Map<string, string>();
  private dependencyGraph = new Map<string, Set<string>>();
  private reverseDependencyGraph = new Map<string, Set<string>>();

  /** Loads token files and builds the dependency graph. */
  load(tokenFiles: Map<string, DTCGTokenFile>): void {
    this.tokenMap.clear();
    this.pathToFile.clear();
    this.dependencyGraph.clear();
    this.reverseDependencyGraph.clear();

    for (const [filePath, file] of tokenFiles) {
      for (const { path, token } of flattenTokens(file, filePath)) {
        this.tokenMap.set(path, token);
        this.pathToFile.set(path, filePath);

        const ref = getReference(token.$value);
        if (ref) {
          if (!this.dependencyGraph.has(path)) {
            this.dependencyGraph.set(path, new Set());
          }
          this.dependencyGraph.get(path)!.add(ref);

          if (!this.reverseDependencyGraph.has(ref)) {
            this.reverseDependencyGraph.set(ref, new Set());
          }
          this.reverseDependencyGraph.get(ref)!.add(path);
        }
      }
    }
  }

  /** Resolves all tokens and returns a flat list of resolved tokens. */
  resolveAll(): ResolvedToken[] {
    const results: ResolvedToken[] = [];

    for (const [path, token] of this.tokenMap) {
      const ref = getReference(token.$value);
      const resolvedValue = this.resolveValue(token.$value, new Set([path]));
      results.push({
        path,
        type: token.$type,
        value: token.$value,
        resolvedValue,
        filePath: this.pathToFile.get(path) || "",
        reference: ref,
        description: token.$description,
      });
    }

    return results;
  }

  /** Resolves a single token value, detecting circular references. */
  resolveValue(value: unknown, visited: Set<string> = new Set()): unknown {
    const ref = getReference(value);
    if (!ref) return value;
    if (visited.has(ref)) {
      throw new Error(
        `Circular reference detected: ${Array.from(visited).join(" -> ")} -> ${ref}`,
      );
    }
    visited.add(ref);
    const target = this.tokenMap.get(ref);
    if (!target) return value;
    return this.resolveValue(target.$value, visited);
  }

  /** Returns all tokens whose $value references the given path. */
  getReferencedBy(tokenPath: string): string[] {
    return Array.from(this.reverseDependencyGraph.get(tokenPath) || []);
  }

  /** Returns all tokens this token references (direct and transitive). */
  getReferences(tokenPath: string): string[] {
    const result = new Set<string>();
    const visited = new Set<string>();

    const walk = (path: string) => {
      if (visited.has(path)) return;
      visited.add(path);
      const deps = this.dependencyGraph.get(path);
      if (!deps) return;
      for (const dep of deps) {
        result.add(dep);
        walk(dep);
      }
    };

    walk(tokenPath);
    return Array.from(result);
  }

  /** Checks if any circular references exist, returning the paths involved. */
  detectCircularReferences(): string[][] {
    const cycles: string[][] = [];
    const globalVisited = new Set<string>();

    for (const path of this.tokenMap.keys()) {
      if (globalVisited.has(path)) continue;

      const stack: string[] = [];
      const stackSet = new Set<string>();

      const dfs = (current: string): boolean => {
        if (stackSet.has(current)) {
          const cycleStart = stack.indexOf(current);
          cycles.push([...stack.slice(cycleStart), current]);
          return true;
        }
        if (globalVisited.has(current)) return false;

        stack.push(current);
        stackSet.add(current);

        const deps = this.dependencyGraph.get(current);
        if (deps) {
          for (const dep of deps) {
            dfs(dep);
          }
        }

        stack.pop();
        stackSet.delete(current);
        globalVisited.add(current);
        return false;
      };

      dfs(path);
    }

    return cycles;
  }
}

/** Convenience function: resolves all tokens from a set of files. */
export function resolveTokens(
  tokenFiles: Map<string, DTCGTokenFile>,
): ResolvedToken[] {
  const resolver = new TokenResolver();
  resolver.load(tokenFiles);
  return resolver.resolveAll();
}
