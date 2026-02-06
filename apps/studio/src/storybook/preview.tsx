import "../index.css";

import type { Preview } from "@storybook/react";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-studio-bg p-8">
        <Story />
      </div>
    ),
  ],
};

export default preview;
