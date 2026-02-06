import { useParams } from "@tanstack/react-router";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

import TokenCategoryDetailView from "@/components/views/TokenCategoryDetailView";
import { fuzzyMatch, fuzzyScore } from "@/lib/fuzzy-search";
import { useTokenKeyboardShortcuts } from "@/lib/keyboard";
import { saveDraft } from "@/lib/persistence";
import { debouncedRegenerate } from "@/lib/preview-css";
import { getTokenStore } from "@/lib/studio-api";

export function TokenCategoryDetail() {
  const { projectId, category } = useParams({
    from: "/projects/$projectId/tokens/$category",
  });
  const store = getTokenStore();
  const [search, setSearch] = useState("");
  const [dirtyInputs, setDirtyInputs] = useState<Map<string, unknown>>(
    new Map(),
  );

  useTokenKeyboardShortcuts();

  const resolvedTokens = useSyncExternalStore(
    store.subscribe,
    () => store.getState().resolvedTokens,
  );

  const tokens = useMemo(() => {
    const categoryMap: Record<string, string[]> = {
      colors: ["color"],
      typography: ["fontFamily", "fontWeight", "fontStyle", "typography"],
      dimensions: ["dimension", "number"],
      shadows: ["shadow"],
    };

    const types = categoryMap[category];
    let filtered = types
      ? resolvedTokens.filter((t) => types.includes(t.type))
      : resolvedTokens;

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
  }, [category, search, resolvedTokens]);

  const handleUpdateToken = useCallback(
    async (path: string, value: unknown) => {
      store.getState().updateToken(path, value);
      const files = store.getState().exportAsJSON();
      debouncedRegenerate(files);
      await saveDraft(projectId, files, "");
      setDirtyInputs((prev) => {
        const next = new Map(prev);
        next.delete(path);
        return next;
      });
    },
    [store, projectId],
  );

  const handleInputDirty = useCallback(
    (path: string, value: unknown) => {
      const token = resolvedTokens.find((t) => t.path === path);
      const currentValue = token?.value;
      setDirtyInputs((prev) => {
        const next = new Map(prev);
        if (value !== currentValue) {
          next.set(path, value);
        } else {
          next.delete(path);
        }
        return next;
      });
    },
    [resolvedTokens],
  );

  const handleSaveAll = useCallback(async () => {
    for (const [path, value] of dirtyInputs) {
      store.getState().updateToken(path, value);
    }
    const files = store.getState().exportAsJSON();
    debouncedRegenerate(files);
    await saveDraft(projectId, files, "");
    setDirtyInputs(new Map());
  }, [dirtyInputs, store, projectId]);

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

  const tokenFiles = Array.from(store.getState().tokenFiles.keys());

  return (
    <TokenCategoryDetailView
      projectId={projectId}
      category={category}
      search={search}
      tokens={tokens}
      canUndo={store.getState().canUndo()}
      canRedo={store.getState().canRedo()}
      dirtyCount={dirtyInputs.size}
      tokenFiles={tokenFiles}
      onSearchChange={setSearch}
      onUpdateToken={handleUpdateToken}
      onInputDirty={handleInputDirty}
      onSaveAll={handleSaveAll}
      onUndo={handleUndo}
      onRedo={handleRedo}
      onAddToken={handleAddToken}
    />
  );
}
