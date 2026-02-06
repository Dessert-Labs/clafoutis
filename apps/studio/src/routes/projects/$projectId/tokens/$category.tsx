import { createFileRoute } from "@tanstack/react-router";

import { TokenCategoryDetail } from "@/pages/TokenCategoryDetail";

export const Route = createFileRoute("/projects/$projectId/tokens/$category")({
  component: TokenCategoryDetail,
});
