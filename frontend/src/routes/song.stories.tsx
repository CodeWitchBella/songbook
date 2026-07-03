import type { Meta, StoryObj } from "@storybook/react-vite";
import localForage from "localforage";

import Song from "./song";

const store = localForage.createInstance({ name: "store" });

const exampleSong = {
  id: "example-id",
  slug: "example",
  lastModified: "2020-01-01T00:00:00.000Z",
  insertedAt: "2020-01-01T00:00:00.000Z",
  author: "Ukázkový autor",
  title: "Ukázková píseň",
  text: `[C]Toto je [G]ukázková [Am]píseň
kterou vidíš ve [F]Storybooku

R: [C]Refrén tady [G]zní
[Am]vesele a [F]jednoduše`,
  fontSize: 1,
  paragraphSpace: 1,
  titleSpace: 1,
  spotify: null,
  pretranspose: 0,
  extraSearchable: null,
  extraNonSearchable: null,
  editor: null,
};

const meta = {
  title: "Routes/Song",
  component: Song,
  parameters: { route: "/song/example", path: "song/:slug" },
  // Seed the song store's cache before the store hydrates, so there is an
  // actual song to render (Storybook has no backend to fetch from).
  loaders: [
    async () => {
      await store.setItem("songs", { items: [exampleSong] });
      return {};
    },
  ],
} satisfies Meta<typeof Song>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
