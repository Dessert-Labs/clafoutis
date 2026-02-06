import { createFileRoute } from "@tanstack/react-router";

import { TokenCatalog } from "@/pages/TokenCatalog";

export const Route = createFileRoute("/projects/$projectId/tokens/")({
  component: TokenCatalog,
});
