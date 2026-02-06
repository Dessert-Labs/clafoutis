import type { TokenStore } from "@clafoutis/studio-core";
import React, { createContext, useContext } from "react";

import { getTokenStore } from "@/lib/studio-api";

const TokenContext = createContext<TokenStore | null>(null);

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const store = getTokenStore();
  return (
    <TokenContext.Provider value={store}>{children}</TokenContext.Provider>
  );
}

export function useTokenStoreContext() {
  const context = useContext(TokenContext);
  if (!context)
    throw new Error("useTokenStoreContext must be used within TokenProvider");
  return context;
}
