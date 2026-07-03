import type { Meta, StoryObj } from "@storybook/react-vite";

import Changelog from "./changelog";

const meta = {
  title: "Routes/Changelog",
  component: Changelog,
  parameters: { route: "/changelog" },
} satisfies Meta<typeof Changelog>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
