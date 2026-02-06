import type { TokenDiff } from "@clafoutis/studio-core";
import type { Meta, StoryObj } from "@storybook/react-vite";

import PublishView from "./PublishView";

const meta = {
  title: "Views/PublishView",
  component: PublishView,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PublishView>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};

const mockDiffs: TokenDiff[] = [
  {
    path: "colors.primary.500",
    type: "modified",
    before: "#6366f1",
    after: "#7c3aed",
  },
  { path: "colors.accent.new", type: "added", after: "#f59e0b" },
  { path: "colors.deprecated", type: "removed", before: "#9ca3af" },
] as TokenDiff[];

export const Default: Story = {
  args: {
    isLocal: false,
    isAuthenticated: true,
    diffs: mockDiffs,
    message: "Update design tokens",
    branchName: "studio/1738886400000",
    pushing: false,
    error: "",
    result: null,
    onMessageChange: noop,
    onBranchNameChange: noop,
    onPush: noop,
    onLogin: noop,
  },
};

export const NoChanges: Story = {
  args: {
    ...Default.args,
    diffs: [],
  },
};

export const LocalProject: Story = {
  args: {
    ...Default.args,
    isLocal: true,
  },
};

export const NotAuthenticated: Story = {
  args: {
    ...Default.args,
    isAuthenticated: false,
  },
};

export const Pushing: Story = {
  args: {
    ...Default.args,
    pushing: true,
  },
};

export const WithError: Story = {
  args: {
    ...Default.args,
    error: "Failed to create branch: 403 Forbidden",
  },
};

export const Success: Story = {
  args: {
    ...Default.args,
    result: {
      sha: "a1b2c3d4e5f6789",
      prUrl: "https://github.com/acme/design-tokens/pull/42",
    },
  },
};
