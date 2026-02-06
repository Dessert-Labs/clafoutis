import { useParams } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";

import TokenCatalogView from "@/components/views/TokenCatalogView";
import { getTokenStore } from "@/lib/studio-api";

export function TokenCatalog() {
  const { projectId } = useParams({ from: "/projects/$projectId/tokens/" });
  const store = getTokenStore();

  const { tokens, categoryCounts } = useSyncExternalStore(
    store.subscribe,
    () => {
      const state = store.getState();
      return {
        tokens: state.resolvedTokens,
        categoryCounts: {
          colors: state.getTokensByCategory("colors").length,
          typography: state.getTokensByCategory("typography").length,
          dimensions: state.getTokensByCategory("dimensions").length,
          shadows: state.getTokensByCategory("shadows").length,
        },
      };
    },
  );

  return (
    <TokenCatalogView
      projectId={projectId}
      tokens={tokens}
      categoryCounts={categoryCounts}
    />
  );
}
