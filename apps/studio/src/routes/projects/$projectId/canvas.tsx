import { createFileRoute } from "@tanstack/react-router";

import { CanvasEditor } from "@/pages/CanvasEditor";

export const Route = createFileRoute("/projects/$projectId/canvas")({
  component: CanvasEditor,
});
