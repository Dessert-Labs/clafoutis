import { createFileRoute } from "@tanstack/react-router";

import { Publish } from "@/pages/Publish";

export const Route = createFileRoute("/projects/$projectId/publish")({
  component: Publish,
});
