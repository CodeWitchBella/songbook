import type { Meta, StoryObj } from "@storybook/react-vite";

import Register from "./register";

const meta = {
  title: "Routes/Register",
  component: Register,
  parameters: { route: "/register" },
} satisfies Meta<typeof Register>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
