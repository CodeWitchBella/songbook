import type { Meta, StoryObj } from "@storybook/react-vite";

import AddToCollection from "./add-to-collection";

const meta = {
  title: "Routes/AddToCollection",
  component: AddToCollection,
  parameters: { route: "/add-to-collection/example", path: "add-to-collection/:slug" },
} satisfies Meta<typeof AddToCollection>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
