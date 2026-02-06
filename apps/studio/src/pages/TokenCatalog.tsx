import { useParams } from "@tanstack/react-router";
import { useMemo, useSyncExternalStore } from "react";

import TokenCatalogView from "@/components/views/TokenCatalogView";
import { getTokenStore } from "@/lib/studio-api";

const CATEGORY_TYPES: Record<string, string[]> = {
  colors: ["color"],
  typography: ["fontFamily", "fontWeight", "fontStyle", "typography"],
  dimensions: ["dimension", "number"],
  shadows: ["shadow"],
};

export function TokenCatalog() {
  const { projectId } = useParams({ from: "/projects/$projectId/tokens/" });
  const store = getTokenStore();

  const tokens = useSyncExternalStore(
    store.subscribe,
    () => store.getState().resolvedTokens,
  );

  const categoryCounts = useMemo(
    () => ({
      colors: tokens.filter((t) => CATEGORY_TYPES.colors.includes(t.type))
        .length,
      typography: tokens.filter((t) =>
        CATEGORY_TYPES.typography.includes(t.type),
      ).length,
      dimensions: tokens.filter((t) =>
        CATEGORY_TYPES.dimensions.includes(t.type),
      ).length,
      shadows: tokens.filter((t) => CATEGORY_TYPES.shadows.includes(t.type))
        .length,
    }),
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
