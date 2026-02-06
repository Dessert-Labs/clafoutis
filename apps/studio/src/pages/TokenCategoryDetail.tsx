import { useParams } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";

import TokenCategoryDetailView from "@/components/views/TokenCategoryDetailView";
import { useTokenKeyboardShortcuts } from "@/lib/keyboard";
import { debouncedRegenerate } from "@/lib/preview-css";
import { getTokenStore } from "@/lib/studio-api";

export function TokenCategoryDetail() {
  const { projectId, category } = useParams({
    from: "/projects/$projectId/tokens/$category",
  });
  const store = getTokenStore();
  const [search, setSearch] = useState("");
  const [, forceUpdate] = useState(0);

  useTokenKeyboardShortcuts();

  const tokens = useMemo(() => {
    const all = store.getState().getTokensByCategory(category);
    if (!search) return all;
    const lower = search.toLowerCase();
    return all.filter(
      (t) =>
        t.path.toLowerCase().includes(lower) ||
        String(t.resolvedValue).toLowerCase().includes(lower) ||
        t.description?.toLowerCase().includes(lower),
    );
  }, [store, category, search]);

  const handleUpdateToken = useCallback(
    (path: string, value: unknown) => {
      store.getState().updateToken(path, value);
      const files = store.getState().exportAsJSON();
      debouncedRegenerate(files);
      forceUpdate((n) => n + 1);
    },
    [store],
  );

  const handleUndo = useCallback(() => {
    store.getState().undoTokenChange();
    forceUpdate((n) => n + 1);
  }, [store]);

  const handleRedo = useCallback(() => {
    store.getState().redoTokenChange();
    forceUpdate((n) => n + 1);
  }, [store]);

  return (
    <TokenCategoryDetailView
      projectId={projectId}
      category={category}
      search={search}
      tokens={tokens}
      canUndo={store.getState().canUndo()}
      canRedo={store.getState().canRedo()}
      onSearchChange={setSearch}
      onUpdateToken={handleUpdateToken}
      onUndo={handleUndo}
      onRedo={handleRedo}
    />
  );
}
