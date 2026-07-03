import type { Meta, StoryObj } from "@storybook/react-vite";

import EditSong from "./edit-song";

const meta = {
  title: "Routes/EditSong",
  component: EditSong,
  parameters: { route: "/edit/example", path: "edit/:slug" },
} satisfies Meta<typeof EditSong>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
