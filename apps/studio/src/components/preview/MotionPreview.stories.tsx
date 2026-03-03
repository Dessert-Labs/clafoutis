import type { Meta, StoryObj } from "@storybook/react-vite";

import { MotionPreview } from "./MotionPreview";

const meta = {
  title: "Preview/MotionPreview",
  component: MotionPreview,
  parameters: { layout: "padded" },
} satisfies Meta<typeof MotionPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ReducedMotion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Enable the "Simulate prefers-reduced-motion" toggle to verify all durations collapse to 0ms.',
      },
    },
  },
};
