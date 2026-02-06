import type { Meta, StoryObj } from "@storybook/react-vite";

import { TEMPLATES } from "@/lib/templates";

import DashboardView from "./DashboardView";

const meta = {
  title: "Views/DashboardView",
  component: DashboardView,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof DashboardView>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};

export const Default: Story = {
  args: {
    templates: TEMPLATES,
    publicRepoInput: "",
    publicRepoError: "",
    isAuthenticated: false,
    authLoading: false,
    showRepos: false,
    reposLoading: false,
    repos: undefined,
    onPublicRepoInputChange: noop,
    onOpenPublicRepo: noop,
    onCreateFromTemplate: noop,
    onImportFiles: noop,
    onSignIn: noop,
    onShowRepos: noop,
    onOpenRepo: noop,
  },
};

export const Authenticated: Story = {
  args: {
    ...Default.args,
    isAuthenticated: true,
    showRepos: false,
  },
};

export const WithRepos: Story = {
  args: {
    ...Default.args,
    isAuthenticated: true,
    showRepos: true,
    reposLoading: false,
    repos: [
      {
        id: 1,
        full_name: "acme/design-tokens",
        name: "design-tokens",
        owner: { login: "acme" },
        description: "Shared design token library",
        updated_at: "2026-01-15T00:00:00Z",
        default_branch: "main",
        private: false,
      },
      {
        id: 2,
        full_name: "acme/brand-system",
        name: "brand-system",
        owner: { login: "acme" },
        description: "Internal brand design system",
        updated_at: "2026-02-01T00:00:00Z",
        default_branch: "main",
        private: true,
      },
    ],
  },
};

export const ReposLoading: Story = {
  args: {
    ...Default.args,
    isAuthenticated: true,
    showRepos: true,
    reposLoading: true,
  },
};

export const WithPublicRepoError: Story = {
  args: {
    ...Default.args,
    publicRepoInput: "invalid-input",
    publicRepoError:
      'Enter a valid repo like "owner/repo" or a full GitHub URL',
  },
};
