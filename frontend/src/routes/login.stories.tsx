import type { Meta, StoryObj } from "@storybook/react-vite";

import Login from "./login";

const meta = {
  title: "Routes/Login",
  component: Login,
  parameters: { route: "/login" },
} satisfies Meta<typeof Login>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
