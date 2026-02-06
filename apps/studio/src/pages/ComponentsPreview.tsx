import type { ResolvedToken } from "@clafoutis/studio-core";
import { useCallback, useRef, useSyncExternalStore } from "react";

import ComponentsPreviewView from "@/components/views/ComponentsPreviewView";
import { getTokenStore } from "@/lib/studio-api";

function useStoreColorTokens() {
  const store = getTokenStore();
  const cachedRef = useRef<ResolvedToken[]>([]);
  const prevLenRef = useRef(-1);
  const prevThemeRef = useRef("");
  const prevTokensRef = useRef<ResolvedToken[] | null>(null);

  return useSyncExternalStore(store.subscribe, () => {
    const state = store.getState();
    const theme = state.activeTheme;
    const tokens = state.resolvedTokens;

    // Only recompute if the resolved tokens array or theme changed
    if (
      tokens !== prevTokensRef.current ||
      tokens.length !== prevLenRef.current ||
      theme !== prevThemeRef.current
    ) {
      prevTokensRef.current = tokens;
      prevLenRef.current = tokens.length;
      prevThemeRef.current = theme;
      cachedRef.current = state.getTokensByCategory("colors");
    }

    return cachedRef.current;
  });
}

export function ComponentsPreview() {
  const store = getTokenStore();

  const activeTheme = useSyncExternalStore(
    store.subscribe,
    () => store.getState().activeTheme,
  );

  const colorTokens = useStoreColorTokens();
  const darkMode = activeTheme === "dark";

  const handleToggleDarkMode = useCallback(() => {
    const next = store.getState().activeTheme === "dark" ? "light" : "dark";
    store.getState().setActiveTheme(next);
  }, [store]);

  return (
    <ComponentsPreviewView
      darkMode={darkMode}
      colorTokens={colorTokens}
      onToggleDarkMode={handleToggleDarkMode}
    />
  );
}
