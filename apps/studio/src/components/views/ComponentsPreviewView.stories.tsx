import type { ResolvedToken } from "@clafoutis/studio-core";
import type { Meta, StoryObj } from "@storybook/react-vite";

import ComponentsPreviewView from "./ComponentsPreviewView";

const meta = {
  title: "Views/ComponentsPreviewView",
  component: ComponentsPreviewView,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ComponentsPreviewView>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};

const mockColorTokens: ResolvedToken[] = [
  // Semantic tokens
  {
    path: "colors.background.primary",
    type: "color",
    value: "{colors.white.100}",
    resolvedValue: "#ffffff",
    reference: "colors.white.100",
  },
  {
    path: "colors.background.secondary",
    type: "color",
    value: "{colors.gray.100}",
    resolvedValue: "#f5f5f5",
    reference: "colors.gray.100",
  },
  {
    path: "colors.text.primary",
    type: "color",
    value: "{colors.gray.1200}",
    resolvedValue: "#171717",
    reference: "colors.gray.1200",
  },
  {
    path: "colors.text.secondary",
    type: "color",
    value: "{colors.gray.1100}",
    resolvedValue: "#404040",
    reference: "colors.gray.1100",
  },
  {
    path: "colors.border.primary",
    type: "color",
    value: "{colors.gray.600}",
    resolvedValue: "#d4d4d4",
    reference: "colors.gray.600",
  },
  {
    path: "colors.state.error.primary",
    type: "color",
    value: "{colors.red.900}",
    resolvedValue: "#ef4444",
    reference: "colors.red.900",
  },
  {
    path: "colors.state.success.primary",
    type: "color",
    value: "{colors.green.900}",
    resolvedValue: "#22c55e",
    reference: "colors.green.900",
  },
  {
    path: "colors.state.warning.primary",
    type: "color",
    value: "{colors.yellow.900}",
    resolvedValue: "#eab308",
    reference: "colors.yellow.900",
  },
  // Component tokens
  {
    path: "colors.button.primary.bg",
    type: "color",
    value: "{colors.gray.1200}",
    resolvedValue: "#171717",
    reference: "colors.gray.1200",
  },
  {
    path: "colors.button.primary.text",
    type: "color",
    value: "{colors.white.100}",
    resolvedValue: "#ffffff",
    reference: "colors.white.100",
  },
  // Primitive tokens
  {
    path: "colors.gray.100",
    type: "color",
    value: "#f5f5f5",
    resolvedValue: "#f5f5f5",
  },
  {
    path: "colors.gray.300",
    type: "color",
    value: "#d4d4d4",
    resolvedValue: "#d4d4d4",
  },
  {
    path: "colors.gray.500",
    type: "color",
    value: "#a3a3a3",
    resolvedValue: "#a3a3a3",
  },
  {
    path: "colors.gray.700",
    type: "color",
    value: "#737373",
    resolvedValue: "#737373",
  },
  {
    path: "colors.gray.900",
    type: "color",
    value: "#525252",
    resolvedValue: "#525252",
  },
  {
    path: "colors.gray.1200",
    type: "color",
    value: "#171717",
    resolvedValue: "#171717",
  },
  {
    path: "colors.blue.500",
    type: "color",
    value: "#6cb6ff",
    resolvedValue: "#6cb6ff",
  },
  {
    path: "colors.blue.900",
    type: "color",
    value: "#3b82f6",
    resolvedValue: "#3b82f6",
  },
  {
    path: "colors.green.900",
    type: "color",
    value: "#22c55e",
    resolvedValue: "#22c55e",
  },
  {
    path: "colors.red.900",
    type: "color",
    value: "#ef4444",
    resolvedValue: "#ef4444",
  },
] as ResolvedToken[];

export const Default: Story = {
  args: {
    darkMode: false,
    colorTokens: mockColorTokens,
    onToggleDarkMode: noop,
  },
};

export const DarkMode: Story = {
  args: {
    ...Default.args,
    darkMode: true,
  },
};

export const NoTokens: Story = {
  args: {
    ...Default.args,
    colorTokens: [],
  },
};
