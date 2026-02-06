import { createFileRoute } from "@tanstack/react-router";

import { ComponentsPreview } from "@/pages/ComponentsPreview";

export const Route = createFileRoute("/projects/$projectId/components")({
  component: ComponentsPreview,
});
