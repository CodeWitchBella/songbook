import type { Meta, StoryObj } from "@storybook/react-vite";

import CollectionList from "./collection-list";

const meta = {
  title: "Routes/CollectionList",
  component: CollectionList,
  parameters: { route: "/collections" },
} satisfies Meta<typeof CollectionList>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
