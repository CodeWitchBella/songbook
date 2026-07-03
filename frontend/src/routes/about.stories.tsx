import type { Meta, StoryObj } from "@storybook/react-vite";

import About from "./about";

const meta = {
  title: "Routes/About",
  component: About,
  parameters: { route: "/about" },
} satisfies Meta<typeof About>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
