import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";

import TokenCatalogView from "./TokenCatalogView";

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
  title: "Views/TokenCatalogView",
  component: TokenCatalogView,
  parameters: { layout: "fullscreen" },
  decorators: [withRouter],
} satisfies Meta<typeof TokenCatalogView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    projectId: "acme--design-tokens",
    tokens: [],
    categoryCounts: { colors: 24, typography: 8, dimensions: 12, shadows: 4 },
  },
};

export const Empty: Story = {
  args: {
    projectId: "acme--design-tokens",
    tokens: [],
    categoryCounts: { colors: 0, typography: 0, dimensions: 0, shadows: 0 },
  },
};
