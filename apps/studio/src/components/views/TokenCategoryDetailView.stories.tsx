import type { ResolvedToken } from "@clafoutis/studio-core";
import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";

import TokenCategoryDetailView from "./TokenCategoryDetailView";

const withRouter: Decorator = (Story) => {
  const rootRoute = createRootRoute({ component: () => <Story /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return <RouterProvider router={router} />;
};

const meta = {
  title: "Views/TokenCategoryDetailView",
  component: TokenCategoryDetailView,
  parameters: { layout: "fullscreen" },
  decorators: [withRouter],
} satisfies Meta<typeof TokenCategoryDetailView>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};

const mockTokens: ResolvedToken[] = [
  {
    path: "colors.primary.500",
    type: "color",
    value: "#6366f1",
    resolvedValue: "#6366f1",
    description: "Primary brand color",
  },
  {
    path: "colors.primary.600",
    type: "color",
    value: "#4f46e5",
    resolvedValue: "#4f46e5",
    description: "Primary hover",
  },
  {
    path: "colors.neutral.100",
    type: "color",
    value: "#f5f5f5",
    resolvedValue: "#f5f5f5",
    description: "Light gray",
  },
  {
    path: "colors.neutral.900",
    type: "color",
    value: "#171717",
    resolvedValue: "#171717",
    description: "Near black",
  },
  {
    path: "colors.success.500",
    type: "color",
    value: "#22c55e",
    resolvedValue: "#22c55e",
    description: "Success green",
  },
  {
    path: "colors.error.500",
    type: "color",
    value: "#ef4444",
    resolvedValue: "#ef4444",
    description: "Error red",
  },
] as ResolvedToken[];

export const Default: Story = {
  args: {
    projectId: "acme--design-tokens",
    category: "colors",
    search: "",
    tokens: mockTokens,
    canUndo: false,
    canRedo: false,
    onSearchChange: noop,
    onUpdateToken: noop,
    onUndo: noop,
    onRedo: noop,
  },
};

export const WithSearch: Story = {
  args: {
    ...Default.args,
    search: "primary",
    tokens: mockTokens.filter((t) => t.path.includes("primary")),
  },
};

export const WithUndoRedo: Story = {
  args: {
    ...Default.args,
    canUndo: true,
    canRedo: true,
  },
};

export const Empty: Story = {
  args: {
    ...Default.args,
    tokens: [],
  },
};
