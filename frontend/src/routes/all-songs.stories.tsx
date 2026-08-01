import type { Meta, StoryObj } from "@storybook/react-vite";

import { Component as AllSongs } from "./all-songs";

const meta = {
  title: "Routes/AllSongs",
  component: AllSongs,
  parameters: {
    route: "/all-songs",
    loader: () => ({ songs: [], stats: { total: 0, unfetched: 0, outdated: 0 }, q: "", results: null }),
  },
} satisfies Meta<typeof AllSongs>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
