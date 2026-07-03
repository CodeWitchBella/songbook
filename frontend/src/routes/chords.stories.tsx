import type { Meta, StoryObj } from "@storybook/react-vite";

import Chords from "./chords";

const meta = {
  title: "Routes/Chords",
  component: Chords,
  parameters: { route: "/chords" },
} satisfies Meta<typeof Chords>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
