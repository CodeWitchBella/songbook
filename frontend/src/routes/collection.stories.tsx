import type { Meta, StoryObj } from "@storybook/react-vite";

import { Component as Collection } from "./collection";

const meta = {
  title: "Routes/Collection",
  component: Collection,
  parameters: { route: "/collection/_/example", path: "collection/:user/:abc" },
} satisfies Meta<typeof Collection>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
