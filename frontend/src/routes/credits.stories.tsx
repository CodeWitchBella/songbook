import type { Meta, StoryObj } from "@storybook/react-vite";

import Credits from "./credits";

const meta = {
  title: "Routes/Credits",
  component: Credits,
  parameters: { route: "/credits" },
} satisfies Meta<typeof Credits>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
