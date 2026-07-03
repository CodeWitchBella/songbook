import type { Meta, StoryObj } from "@storybook/react-vite";

import CreateSong from "./create-song";

const meta = {
  title: "Routes/CreateSong",
  component: CreateSong,
  parameters: { route: "/new" },
} satisfies Meta<typeof CreateSong>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
