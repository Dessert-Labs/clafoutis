import type { Meta, StoryObj } from "@storybook/react-vite";

import SettingsView from "./SettingsView";

const meta = {
  title: "Views/SettingsView",
  component: SettingsView,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SettingsView>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};

export const Default: Story = {
  args: {
    dark: false,
    user: null,
    isAuthenticated: false,
    onToggleTheme: noop,
    onLogin: noop,
    onLogout: noop,
  },
};

export const DarkMode: Story = {
  args: {
    ...Default.args,
    dark: true,
  },
};

export const Authenticated: Story = {
  args: {
    ...Default.args,
    isAuthenticated: true,
    user: {
      login: "beauwilliams",
      avatar_url: "https://avatars.githubusercontent.com/u/9919?v=4",
      name: "Beau Williams",
    },
  },
};
