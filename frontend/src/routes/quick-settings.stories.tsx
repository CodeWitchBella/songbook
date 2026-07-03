import type { Meta, StoryObj } from "@storybook/react-vite";

import QuickSettings from "./quick-settings";

const meta = {
  title: "Routes/QuickSettings",
  component: QuickSettings,
  parameters: { route: "/quick-settings" },
} satisfies Meta<typeof QuickSettings>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
