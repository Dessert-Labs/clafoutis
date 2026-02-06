import { createStore } from "zustand/vanilla";

import type {
  DTCGToken,
  DTCGTokenFile,
  ResolvedToken,
  TokenDiff,
  TokenGroupNode,
  TokenSnapshot,
} from "../types/tokens";

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

function resolveValue(
  value: unknown,
  tokenMap: Map<string, DTCGToken>,
  visited: Set<string> = new Set(),
  path = "",
): unknown {
  const ref = getReference(value);
  if (!ref) return value;
  if (visited.has(ref)) return value;
  visited.add(path);
  const target = tokenMap.get(ref);
  if (!target) return value;
  return resolveValue(target.$value, tokenMap, visited, ref);
}

function deepCloneFile(file: DTCGTokenFile): DTCGTokenFile {
  return JSON.parse(JSON.stringify(file));
}

function setNestedValue(
  obj: DTCGTokenFile,
  path: string,
  token: DTCGToken,
): void {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current) || typeof current[parts[i]] !== "object") {
      current[parts[i]] = {};
    }
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = token;
}

function getNestedValue(
  obj: DTCGTokenFile,
  path: string,
): DTCGToken | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return isToken(current) ? current : undefined;
}

function deleteNestedValue(obj: DTCGTokenFile, path: string): boolean {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof current[parts[i]] !== "object" || current[parts[i]] === null)
      return false;
    current = current[parts[i]] as Record<string, unknown>;
  }
  const key = parts[parts.length - 1];
  if (key in current) {
    delete current[key];
    return true;
  }
  return false;
}

function detectThemes(fileKeys: string[]): string[] {
  const themes = new Set<string>(["light"]);
  for (const key of fileKeys) {
    const match = key.match(/\.(\w+)\.json$/);
    if (match && match[1] !== "json") {
      const name = key
        .replace(/\.json$/, "")
        .split(".")
        .pop();
      if (
        name &&
        name !==
          key
            .replace(/\.json$/, "")
            .split("/")
            .pop()
            ?.split(".")[0]
      ) {
        themes.add(name);
      }
    }
    if (key.includes(".dark.json") || key.includes(".dark/")) {
      themes.add("dark");
    }
  }
  return Array.from(themes);
}

function getThemeFile(filePath: string, theme: string): string {
  if (theme === "light") return filePath;
  const ext = ".json";
  const base = filePath.endsWith(ext)
    ? filePath.slice(0, -ext.length)
    : filePath;
  return `${base}.${theme}${ext}`;
}

function buildGroupTree(
  tokens: { path: string; filePath: string }[],
): TokenGroupNode[] {
  const root: TokenGroupNode = {
    name: "",
    path: "",
    children: [],
    tokenCount: 0,
  };

  for (const { path } of tokens) {
    const parts = path.split(".");
    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const groupPath = parts.slice(0, i + 1).join(".");
      let child = current.children.find((c) => c.path === groupPath);
      if (!child) {
        child = {
          name: parts[i],
          path: groupPath,
          children: [],
          tokenCount: 0,
        };
        current.children.push(child);
      }
      current = child;
    }
    current.tokenCount++;
  }

  return root.children;
}

const MAX_UNDO_STACK = 50;

function trimStack<T>(stack: T[], newItem: T): T[] {
  const newStack = [...stack, newItem];
  return newStack.length > MAX_UNDO_STACK
    ? newStack.slice(-MAX_UNDO_STACK)
    : newStack;
}

export interface TokenState {
  tokenFiles: Map<string, DTCGTokenFile>;
  resolvedTokens: ResolvedToken[];
  dirtyFiles: Set<string>;
  baseline: Map<string, DTCGTokenFile>;
  themes: string[];
  activeTheme: string;
  undoStack: TokenSnapshot[];
  redoStack: TokenSnapshot[];

  loadTokens: (files: Record<string, DTCGTokenFile>) => void;
  updateToken: (path: string, value: unknown, theme?: string) => void;
  addToken: (
    path: string,
    type: string,
    value: unknown,
    filePath: string,
  ) => void;
  removeToken: (path: string) => void;
  getTokensByCategory: (category?: string) => ResolvedToken[];
  exportAsJSON: () => Record<string, DTCGTokenFile>;
  getDiff: () => TokenDiff[];

  getTokenValue: (path: string, theme?: string) => unknown;
  getThemeOverrides: (path: string) => Record<string, unknown>;
  setActiveTheme: (theme: string) => void;

  createTokenFile: (filePath: string) => void;
  deleteTokenFile: (filePath: string) => void;
  renameTokenGroup: (oldPath: string, newPath: string) => void;
  moveToken: (tokenPath: string, targetFilePath: string) => void;
  getTokenGroups: () => TokenGroupNode[];

  undoTokenChange: () => void;
  redoTokenChange: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

function getFileTheme(filePath: string): string | null {
  // Extract filename: "colors/primitives.dark.json" -> "primitives.dark.json"
  const fileName = filePath.split("/").pop() ?? filePath;
  const segments = fileName.split(".");
  // Base files: ["primitives", "json"] (2 segments)
  // Theme files: ["primitives", "dark", "json"] (3+ segments)
  if (segments.length >= 3 && segments[segments.length - 1] === "json") {
    return segments[segments.length - 2]; // "dark"
  }
  return null;
}

function isThemeFile(filePath: string): boolean {
  return getFileTheme(filePath) !== null;
}

function resolveAll(
  tokenFiles: Map<string, DTCGTokenFile>,
  activeTheme = "light",
): ResolvedToken[] {
  const merged = new Map<string, { token: DTCGToken; filePath: string }>();

  // First pass: load base (non-theme) tokens
  for (const [filePath, file] of tokenFiles) {
    if (isThemeFile(filePath)) continue;
    for (const { path, token } of flattenTokens(file, filePath)) {
      merged.set(path, { token, filePath });
    }
  }

  // Second pass: overlay active theme overrides
  if (activeTheme !== "light") {
    for (const [filePath, file] of tokenFiles) {
      const theme = getFileTheme(filePath);
      if (theme !== activeTheme) continue;
      for (const { path, token } of flattenTokens(file, filePath)) {
        merged.set(path, { token, filePath });
      }
    }
  }

  // Build a lookup map for reference resolution (includes all themes for resolving)
  const tokenMap = new Map<string, DTCGToken>();
  for (const [path, { token }] of merged) {
    tokenMap.set(path, token);
  }

  return Array.from(merged.entries()).map(([path, { token, filePath }]) => {
    const ref = getReference(token.$value);
    const resolvedValue = resolveValue(token.$value, tokenMap, new Set(), path);
    return {
      path,
      type: token.$type,
      value: token.$value,
      resolvedValue,
      filePath,
      reference: ref,
      description: token.$description,
    };
  });
}

function pushSnapshot(state: {
  tokenFiles: Map<string, DTCGTokenFile>;
}): TokenSnapshot {
  const files = new Map<string, DTCGTokenFile>();
  for (const [k, v] of state.tokenFiles) {
    files.set(k, deepCloneFile(v));
  }
  return { files, timestamp: Date.now() };
}

export const createTokenStore = (initialState?: Partial<TokenState>) => {
  return createStore<TokenState>((set, get) => ({
    tokenFiles: new Map(),
    resolvedTokens: [],
    dirtyFiles: new Set(),
    baseline: new Map(),
    themes: ["light"],
    activeTheme: "light",
    undoStack: [],
    redoStack: [],
    ...initialState,

    loadTokens: (files) => {
      const tokenFiles = new Map(Object.entries(files));
      const baseline = new Map<string, DTCGTokenFile>();
      for (const [k, v] of tokenFiles) {
        baseline.set(k, deepCloneFile(v));
      }
      const themes = detectThemes(Array.from(tokenFiles.keys()));
      const resolvedTokens = resolveAll(tokenFiles, "light");
      set({
        tokenFiles,
        baseline,
        resolvedTokens,
        dirtyFiles: new Set(),
        themes,
        activeTheme: "light",
        undoStack: [],
        redoStack: [],
      });
    },

    updateToken: (path, value, theme) => {
      const state = get();
      const snapshot = pushSnapshot(state);
      const tokenFiles = new Map(state.tokenFiles);

      let updated = false;
      for (const [filePath, file] of tokenFiles) {
        if (theme && theme !== "light") {
          const themeFilePath = getThemeFile(filePath, theme);
          if (tokenFiles.has(themeFilePath)) {
            const themeFile = deepCloneFile(tokenFiles.get(themeFilePath)!);
            const existing = getNestedValue(themeFile, path);
            if (existing) {
              existing.$value = value;
              tokenFiles.set(themeFilePath, themeFile);
              updated = true;
              break;
            }
            const baseToken = getNestedValue(file, path);
            if (baseToken) {
              setNestedValue(themeFile, path, {
                $type: baseToken.$type,
                $value: value,
              });
              tokenFiles.set(themeFilePath, themeFile);
              updated = true;
              break;
            }
          }
          continue;
        }

        const cloned = deepCloneFile(file);
        const token = getNestedValue(cloned, path);
        if (token) {
          token.$value = value;
          tokenFiles.set(filePath, cloned);
          const dirtyFiles = new Set(state.dirtyFiles);
          dirtyFiles.add(filePath);
          set({
            tokenFiles,
            resolvedTokens: resolveAll(tokenFiles, get().activeTheme),
            dirtyFiles,
            undoStack: trimStack(state.undoStack, snapshot),
            redoStack: [],
          });
          updated = true;
          break;
        }
      }

      if (updated && theme && theme !== "light") {
        const dirtyFiles = new Set(state.dirtyFiles);
        for (const fp of tokenFiles.keys()) {
          if (fp.includes(`.${theme}.`)) dirtyFiles.add(fp);
        }
        set({
          tokenFiles,
          resolvedTokens: resolveAll(tokenFiles, get().activeTheme),
          dirtyFiles,
          undoStack: trimStack(state.undoStack, snapshot),
          redoStack: [],
        });
      }
    },

    addToken: (path, type, value, filePath) => {
      const state = get();
      const snapshot = pushSnapshot(state);
      const tokenFiles = new Map(state.tokenFiles);
      const file = deepCloneFile(
        tokenFiles.get(filePath) || ({} as DTCGTokenFile),
      );
      setNestedValue(file, path, { $type: type, $value: value } as DTCGToken);
      tokenFiles.set(filePath, file);

      const dirtyFiles = new Set(state.dirtyFiles);
      dirtyFiles.add(filePath);
      set({
        tokenFiles,
        resolvedTokens: resolveAll(tokenFiles, get().activeTheme),
        dirtyFiles,
        undoStack: trimStack(state.undoStack, snapshot),
        redoStack: [],
      });
    },

    removeToken: (path) => {
      const state = get();
      const snapshot = pushSnapshot(state);
      const tokenFiles = new Map(state.tokenFiles);
      const dirtyFiles = new Set(state.dirtyFiles);

      for (const [filePath, file] of tokenFiles) {
        const cloned = deepCloneFile(file);
        if (deleteNestedValue(cloned, path)) {
          tokenFiles.set(filePath, cloned);
          dirtyFiles.add(filePath);
        }
      }

      set({
        tokenFiles,
        resolvedTokens: resolveAll(tokenFiles, get().activeTheme),
        dirtyFiles,
        undoStack: trimStack(state.undoStack, snapshot),
        redoStack: [],
      });
    },

    getTokensByCategory: (category) => {
      const { resolvedTokens } = get();
      if (!category) return resolvedTokens;

      const categoryMap: Record<string, string[]> = {
        colors: ["color"],
        typography: ["fontFamily", "fontWeight", "fontStyle", "typography"],
        dimensions: ["dimension", "number"],
        shadows: ["shadow"],
      };

      const types = categoryMap[category];
      if (!types) return resolvedTokens;
      return resolvedTokens.filter((t) => types.includes(t.type));
    },

    exportAsJSON: () => {
      const { tokenFiles } = get();
      const result: Record<string, DTCGTokenFile> = {};
      for (const [filePath, file] of tokenFiles) {
        result[filePath] = deepCloneFile(file);
      }
      return result;
    },

    getDiff: () => {
      const { tokenFiles, baseline } = get();
      const diffs: TokenDiff[] = [];

      const currentFlat = new Map<string, unknown>();
      for (const [, file] of tokenFiles) {
        for (const { path, token } of flattenTokens(file, "")) {
          currentFlat.set(path, token.$value);
        }
      }

      const baselineFlat = new Map<string, unknown>();
      for (const [, file] of baseline) {
        for (const { path, token } of flattenTokens(file, "")) {
          baselineFlat.set(path, token.$value);
        }
      }

      for (const [path, value] of currentFlat) {
        if (!baselineFlat.has(path)) {
          diffs.push({ path, type: "added", after: value });
        } else if (
          JSON.stringify(value) !== JSON.stringify(baselineFlat.get(path))
        ) {
          diffs.push({
            path,
            type: "modified",
            before: baselineFlat.get(path),
            after: value,
          });
        }
      }

      for (const [path, value] of baselineFlat) {
        if (!currentFlat.has(path)) {
          diffs.push({ path, type: "removed", before: value });
        }
      }

      return diffs;
    },

    getTokenValue: (path, theme) => {
      const { tokenFiles } = get();
      const effectiveTheme = theme || get().activeTheme;

      if (effectiveTheme !== "light") {
        for (const [filePath, file] of tokenFiles) {
          if (filePath.includes(`.${effectiveTheme}.`)) {
            const token = getNestedValue(file, path);
            if (token) return token.$value;
          }
        }
      }

      for (const [filePath, file] of tokenFiles) {
        if (!filePath.includes(".dark.") && !filePath.match(/\.\w+\.json$/)) {
          const token = getNestedValue(file, path);
          if (token) return token.$value;
        }
      }

      for (const [, file] of tokenFiles) {
        const token = getNestedValue(file, path);
        if (token) return token.$value;
      }

      return undefined;
    },

    getThemeOverrides: (path) => {
      const { themes } = get();
      const overrides: Record<string, unknown> = {};
      for (const theme of themes) {
        overrides[theme] = get().getTokenValue(path, theme);
      }
      return overrides;
    },

    setActiveTheme: (theme) => {
      const { tokenFiles } = get();
      set({
        activeTheme: theme,
        resolvedTokens: resolveAll(tokenFiles, theme),
      });
    },

    createTokenFile: (filePath) => {
      const state = get();
      const tokenFiles = new Map(state.tokenFiles);
      if (!tokenFiles.has(filePath)) {
        tokenFiles.set(filePath, {});
        set({ tokenFiles });
      }
    },

    deleteTokenFile: (filePath) => {
      const state = get();
      const snapshot = pushSnapshot(state);
      const tokenFiles = new Map(state.tokenFiles);
      tokenFiles.delete(filePath);
      const dirtyFiles = new Set(state.dirtyFiles);
      dirtyFiles.add(filePath);
      set({
        tokenFiles,
        resolvedTokens: resolveAll(tokenFiles, get().activeTheme),
        dirtyFiles,
        undoStack: trimStack(state.undoStack, snapshot),
        redoStack: [],
      });
    },

    renameTokenGroup: (oldPath, newPath) => {
      const state = get();
      const snapshot = pushSnapshot(state);
      const tokenFiles = new Map(state.tokenFiles);
      const dirtyFiles = new Set(state.dirtyFiles);

      for (const [filePath, file] of tokenFiles) {
        const cloned = deepCloneFile(file);
        const flat = flattenTokens(cloned, filePath);
        let modified = false;

        for (const { path, token } of flat) {
          if (path.startsWith(oldPath + ".") || path === oldPath) {
            const newTokenPath =
              path === oldPath ? newPath : newPath + path.slice(oldPath.length);
            deleteNestedValue(cloned, path);
            setNestedValue(cloned, newTokenPath, { ...token });
            modified = true;
          }

          if (typeof token.$value === "string") {
            const ref = getReference(token.$value);
            if (ref && (ref.startsWith(oldPath + ".") || ref === oldPath)) {
              const newRef =
                ref === oldPath ? newPath : newPath + ref.slice(oldPath.length);
              token.$value = `{${newRef}}`;
              const current = getNestedValue(cloned, path);
              if (current) current.$value = `{${newRef}}`;
              modified = true;
            }
          }
        }

        if (modified) {
          tokenFiles.set(filePath, cloned);
          dirtyFiles.add(filePath);
        }
      }

      set({
        tokenFiles,
        resolvedTokens: resolveAll(tokenFiles, get().activeTheme),
        dirtyFiles,
        undoStack: trimStack(state.undoStack, snapshot),
        redoStack: [],
      });
    },

    moveToken: (tokenPath, targetFilePath) => {
      const state = get();
      const snapshot = pushSnapshot(state);
      const tokenFiles = new Map(state.tokenFiles);
      const dirtyFiles = new Set(state.dirtyFiles);

      let foundToken: DTCGToken | undefined;
      for (const [filePath, file] of tokenFiles) {
        const cloned = deepCloneFile(file);
        const token = getNestedValue(cloned, tokenPath);
        if (token) {
          foundToken = { ...token };
          deleteNestedValue(cloned, tokenPath);
          tokenFiles.set(filePath, cloned);
          dirtyFiles.add(filePath);
          break;
        }
      }

      if (foundToken) {
        const targetFile = deepCloneFile(
          tokenFiles.get(targetFilePath) || ({} as DTCGTokenFile),
        );
        setNestedValue(targetFile, tokenPath, foundToken);
        tokenFiles.set(targetFilePath, targetFile);
        dirtyFiles.add(targetFilePath);
      }

      set({
        tokenFiles,
        resolvedTokens: resolveAll(tokenFiles, get().activeTheme),
        dirtyFiles,
        undoStack: trimStack(state.undoStack, snapshot),
        redoStack: [],
      });
    },

    getTokenGroups: () => {
      const { resolvedTokens } = get();
      return buildGroupTree(resolvedTokens);
    },

    undoTokenChange: () => {
      const state = get();
      if (state.undoStack.length === 0) return;
      const currentSnapshot = pushSnapshot(state);
      const prev = state.undoStack[state.undoStack.length - 1];
      set({
        tokenFiles: prev.files,
        resolvedTokens: resolveAll(prev.files, get().activeTheme),
        undoStack: state.undoStack.slice(0, -1),
        redoStack: trimStack(state.redoStack, currentSnapshot),
      });
    },

    redoTokenChange: () => {
      const state = get();
      if (state.redoStack.length === 0) return;
      const currentSnapshot = pushSnapshot(state);
      const next = state.redoStack[state.redoStack.length - 1];
      set({
        tokenFiles: next.files,
        resolvedTokens: resolveAll(next.files, get().activeTheme),
        undoStack: trimStack(state.undoStack, currentSnapshot),
        redoStack: state.redoStack.slice(0, -1),
      });
    },

    canUndo: () => get().undoStack.length > 0,
    canRedo: () => get().redoStack.length > 0,
  }));
};

export type TokenStore = ReturnType<typeof createTokenStore>;
