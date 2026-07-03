import type { Meta, StoryObj } from "@storybook/react-vite";

import CollectionDiff from "./collection-diff";

const meta = {
  title: "Routes/CollectionDiff",
  component: CollectionDiff,
  parameters: { route: "/diff" },
} satisfies Meta<typeof CollectionDiff>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
