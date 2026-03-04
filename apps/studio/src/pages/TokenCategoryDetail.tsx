import type { DTCGTokenFile, ResolvedToken } from "@clafoutis/studio-core";
import { useParams } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import TokenCategoryDetailView from "@/components/views/TokenCategoryDetailView";
import { fuzzyMatch, fuzzyScore } from "@/lib/fuzzy-search";
import { useTokenKeyboardShortcuts } from "@/lib/keyboard";
import { saveDraft } from "@/lib/persistence";
import { debouncedRegenerate } from "@/lib/preview-css";
import { getTokenStore } from "@/lib/studio-api";

const REFERENCE_PATTERN = /^\{([^}]+)\}$/;

function isDTCGToken(
  value: unknown,
): value is { $type: string; $value: unknown; $description?: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "$type" in value &&
    "$value" in value
  );
}

function getReferencePath(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const match = REFERENCE_PATTERN.exec(value);
  return match ? match[1] : undefined;
}

function resolveTokenValue(
  value: unknown,
  byPath: Map<string, unknown>,
  visited: Set<string> = new Set(),
): unknown {
  const refPath = getReferencePath(value);
  if (!refPath) return value;
  if (visited.has(refPath)) return value;
  const targetValue = byPath.get(refPath);
  if (targetValue === undefined) return value;
  visited.add(refPath);
  return resolveTokenValue(targetValue, byPath, visited);
}

function flattenTokenFile(
  file: DTCGTokenFile,
  filePath: string,
  prefix = "",
): ResolvedToken[] {
  const tokens: ResolvedToken[] = [];
  for (const [key, value] of Object.entries(file)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    if (isDTCGToken(value)) {
      tokens.push({
        path: currentPath,
        type: value.$type,
        value: value.$value,
        resolvedValue: value.$value,
        filePath,
        reference: getReferencePath(value.$value),
        description: value.$description,
      });
      continue;
    }
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      tokens.push(...flattenTokenFile(value, filePath, currentPath));
    }
  }
  return tokens;
}

function setTokenValueInFile(
  file: DTCGTokenFile,
  path: string,
  value: unknown,
): DTCGTokenFile {
  const copy = structuredClone(file);
  const parts = path.split(".");
  let current: Record<string, unknown> = copy;
  for (let i = 0; i < parts.length - 1; i++) {
    const next = current[parts[i]];
    if (typeof next !== "object" || next === null || Array.isArray(next)) {
      throw new Error(`Token path not found: ${path}`);
    }
    current = next as Record<string, unknown>;
  }
  const leafKey = parts.at(-1);
  if (!leafKey) {
    throw new Error(`Token path not found: ${path}`);
  }
  const leaf = current[leafKey];
  if (!isDTCGToken(leaf)) {
    throw new Error(`Token path not found: ${path}`);
  }
  leaf.$value = value;
  return copy;
}

export function TokenCategoryDetail() {
  const { projectId, category } = useParams({
    from: "/projects/$projectId/tokens/$category",
  });
  const store = getTokenStore();
  const [search, setSearch] = useState("");
  const [selectedTokenFile, setSelectedTokenFile] = useState("all");
  const [dirtyInputs, setDirtyInputs] = useState<
    Map<string, { path: string; filePath: string; value: unknown }>
  >(new Map());

  useTokenKeyboardShortcuts();

  const tokenFilesMap = useSyncExternalStore(
    store.subscribe,
    () => store.getState().tokenFiles,
  );
  const tokenFiles = useMemo(
    () => Array.from(tokenFilesMap.keys()),
    [tokenFilesMap],
  );
  useEffect(() => {
    if (selectedTokenFile === "all") return;
    if (!tokenFiles.includes(selectedTokenFile)) {
      setSelectedTokenFile("all");
    }
  }, [tokenFiles, selectedTokenFile]);

  const allTokens = useMemo(() => {
    const tokens: ResolvedToken[] = [];
    for (const [filePath, file] of tokenFilesMap.entries()) {
      tokens.push(...flattenTokenFile(file, filePath));
    }

    const byPath = new Map<string, unknown>();
    for (const token of tokens) {
      byPath.set(token.path, token.value);
    }

    return tokens.map((token) => ({
      ...token,
      resolvedValue: resolveTokenValue(token.value, byPath),
    }));
  }, [tokenFilesMap]);

  const categoryTokens = useMemo(() => {
    const categoryMap: Record<string, string[]> = {
      colors: ["color"],
      typography: ["fontFamily", "fontWeight", "fontStyle", "typography"],
      dimensions: ["dimension", "number"],
      shadows: ["shadow"],
      motion: ["duration", "cubicBezier", "string"],
    };

    const types = categoryMap[category];
    return types ? allTokens.filter((t) => types.includes(t.type)) : allTokens;
  }, [category, allTokens]);

  const fileTokenCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const filePath of tokenFiles) {
      counts[filePath] = 0;
    }
    for (const token of categoryTokens) {
      counts[token.filePath] = (counts[token.filePath] ?? 0) + 1;
    }
    return counts;
  }, [categoryTokens, tokenFiles]);

  const tokens = useMemo(() => {
    let filtered = categoryTokens;
    if (selectedTokenFile !== "all") {
      filtered = filtered.filter((t) => t.filePath === selectedTokenFile);
    }

    if (search) {
      filtered = filtered
        .map((token) => {
          const pathMatch = fuzzyMatch(token.path, search);
          const valueMatch = fuzzyMatch(String(token.resolvedValue), search);
          const descMatch = token.description
            ? fuzzyMatch(token.description, search)
            : false;

          if (pathMatch || valueMatch || descMatch) {
            const pathScore = fuzzyScore(token.path, search);
            const valueScore = fuzzyScore(String(token.resolvedValue), search);
            const descScore = token.description
              ? fuzzyScore(token.description, search)
              : 0;
            return {
              token,
              score: Math.max(pathScore, valueScore, descScore),
            };
          }
          return null;
        })
        .filter(
          (item): item is { token: (typeof filtered)[0]; score: number } =>
            item !== null,
        )
        .sort((a, b) => b.score - a.score)
        .map((item) => item.token);
    }

    return filtered;
  }, [categoryTokens, search, selectedTokenFile]);

  const updateTokenInSpecificFile = useCallback(
    (filePath: string, path: string, value: unknown) => {
      const file = store.getState().exportTokenFile(filePath);
      if (!file) {
        throw new Error(`Token file not found: ${filePath}`);
      }
      const updatedFile = setTokenValueInFile(file, path, value);
      store.getState().replaceTokenFile(filePath, updatedFile);
    },
    [store],
  );

  const handleUpdateToken = useCallback(
    async (path: string, value: unknown, filePath: string) => {
      updateTokenInSpecificFile(filePath, path, value);
      const files = store.getState().exportAsJSON();
      debouncedRegenerate(files);
      await saveDraft(projectId, files, "");
      setDirtyInputs((prev) => {
        const next = new Map(prev);
        next.delete(`${filePath}::${path}`);
        return next;
      });
    },
    [store, projectId, updateTokenInSpecificFile],
  );

  const handleInputDirty = useCallback(
    (path: string, value: unknown, filePath: string) => {
      const token = allTokens.find(
        (t) => t.path === path && t.filePath === filePath,
      );
      const currentValue = token?.value;
      setDirtyInputs((prev) => {
        const next = new Map(prev);
        const key = `${filePath}::${path}`;
        if (value === currentValue) {
          next.delete(key);
        } else {
          next.set(key, { path, filePath, value });
        }
        return next;
      });
    },
    [allTokens],
  );

  const handleSaveAll = useCallback(async () => {
    for (const { path, filePath, value } of dirtyInputs.values()) {
      updateTokenInSpecificFile(filePath, path, value);
    }
    const files = store.getState().exportAsJSON();
    debouncedRegenerate(files);
    await saveDraft(projectId, files, "");
    setDirtyInputs(new Map());
  }, [dirtyInputs, store, projectId, updateTokenInSpecificFile]);

  const handleUndo = useCallback(() => {
    store.getState().undoTokenChange();
  }, [store]);

  const handleRedo = useCallback(() => {
    store.getState().redoTokenChange();
  }, [store]);

  const handleAddToken = useCallback(
    async (path: string, type: string, value: unknown, filePath: string) => {
      store.getState().addToken(path, type, value, filePath);
      const files = store.getState().exportAsJSON();
      debouncedRegenerate(files);
      await saveDraft(projectId, files, "");
    },
    [store, projectId],
  );

  const handleCopyTokenFileJSON = useCallback(
    async (filePath: string) => {
      const file = store.getState().exportTokenFile(filePath);
      if (!file) {
        throw new Error(`Token file not found: ${filePath}`);
      }
      const serialized = JSON.stringify(file, null, 2);
      await navigator.clipboard.writeText(serialized);
    },
    [store],
  );

  const handleGetTokenFileJSON = useCallback(
    async (filePath: string) => {
      const file = store.getState().exportTokenFile(filePath);
      if (!file) {
        throw new Error(`Token file not found: ${filePath}`);
      }
      return JSON.stringify(file, null, 2);
    },
    [store],
  );

  const handleImportTokenFileJSON = useCallback(
    async (filePath: string, jsonText: string) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        throw new Error("Invalid JSON. Please paste a valid token file.");
      }

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Token file JSON must be an object.");
      }

      store.getState().replaceTokenFile(filePath, parsed as DTCGTokenFile);
      const files = store.getState().exportAsJSON();
      debouncedRegenerate(files);
      await saveDraft(projectId, files, "");
      setDirtyInputs(new Map());
    },
    [store, projectId],
  );

  const existingTokenPaths = useMemo(
    () => allTokens.map((t) => t.path),
    [allTokens],
  );

  return (
    <TokenCategoryDetailView
      projectId={projectId}
      category={category}
      search={search}
      tokens={tokens}
      existingTokenPaths={existingTokenPaths}
      canUndo={store.getState().canUndo()}
      canRedo={store.getState().canRedo()}
      dirtyCount={dirtyInputs.size}
      tokenFiles={tokenFiles}
      fileTokenCounts={fileTokenCounts}
      selectedTokenFile={selectedTokenFile}
      onSearchChange={setSearch}
      onSelectedTokenFileChange={setSelectedTokenFile}
      onUpdateToken={handleUpdateToken}
      onInputDirty={handleInputDirty}
      onSaveAll={handleSaveAll}
      onUndo={handleUndo}
      onRedo={handleRedo}
      onAddToken={handleAddToken}
      onCopyTokenFileJSON={handleCopyTokenFileJSON}
      onGetTokenFileJSON={handleGetTokenFileJSON}
      onImportTokenFileJSON={handleImportTokenFileJSON}
    />
  );
}
