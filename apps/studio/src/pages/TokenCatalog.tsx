import { useParams } from "@tanstack/react-router";
import { useMemo, useSyncExternalStore } from "react";

import TokenCatalogView from "@/components/views/TokenCatalogView";
import { getTokenStore } from "@/lib/studio-api";

const CATEGORY_TYPES: Record<string, string[]> = {
  colors: ["color"],
  typography: ["fontFamily", "fontWeight", "fontStyle", "typography"],
  dimensions: ["dimension", "number"],
  shadows: ["shadow"],
  motion: ["duration", "cubicBezier"],
};

export function TokenCatalog() {
  const { projectId } = useParams({ from: "/projects/$projectId/tokens/" });
  const store = getTokenStore();

  const tokens = useSyncExternalStore(
    store.subscribe,
    () => store.getState().resolvedTokens,
  );

  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(CATEGORY_TYPES).map(([category, types]) => [
          category,
          tokens.filter((t) => types.includes(t.type)).length,
        ]),
      ),
    [tokens],
  );

  return (
    <TokenCatalogView
      projectId={projectId}
      tokens={tokens}
      categoryCounts={categoryCounts}
    />
  );
}
