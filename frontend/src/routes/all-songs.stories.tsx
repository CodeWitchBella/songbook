import type { Meta, StoryObj } from "@storybook/react-vite";

import AllSongs from "./all-songs";

const meta = {
  title: "Routes/AllSongs",
  component: AllSongs,
  parameters: { route: "/all-songs" },
} satisfies Meta<typeof AllSongs>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
