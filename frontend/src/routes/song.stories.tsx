import type { Meta, StoryObj } from "@storybook/react-vite";

import Song from "./song";

const meta = {
  title: "Routes/Song",
  component: Song,
  parameters: { route: "/song/example", path: "song/:slug" },
} satisfies Meta<typeof Song>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
