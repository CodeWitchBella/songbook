import type { Meta, StoryObj } from "@storybook/react-vite";

import Home from "./home";

const meta = {
  title: "Routes/Home",
  component: Home,
} satisfies Meta<typeof Home>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
