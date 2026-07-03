import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // The project's package.json "babel" preset (react-app) isn't installed; skip
  // react-docgen so it doesn't try to spin up a babel parser for prop tables.
  typescript: {
    reactDocgen: false,
  },
};

export default config;
