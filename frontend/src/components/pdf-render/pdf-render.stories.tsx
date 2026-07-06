import type { Meta, StoryObj } from "@storybook/react-vite";
import { DateTime } from "luxon";
import type { SongType } from "#/store/store-song";

import PDFRender from "./pdf-render";

const exampleSong: SongType = {
  id: "example-id",
  slug: "example",
  lastModified: DateTime.fromISO("2020-01-01T00:00:00.000Z"),
  insertedAt: DateTime.fromISO("2020-01-01T00:00:00.000Z"),
  author: "Ukázkový autor",
  title: "Ukázková píseň",
  text: `[C]Toto je [G]ukázková [Am]píseň
kterou vidíš ve [F]Storybooku

R: [C]Refrén tady [G]zní
[Am]vesele a [F]jednoduše

2. [C]Druhá sloka [G]přidává
[Am]delší text na [F]ukázku
[C]zalamování [G]řádků
[Am]v PDF vy[F]kreslení`,
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
  title: "Components/PDF Render",
  component: PDFRender,
  // PDFRender reads the `footer` query param via the router, which the global
  // MemoryRouter decorator provides.
  args: { song: exampleSong },
} satisfies Meta<typeof PDFRender>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LargeFont: Story = {
  args: { song: { ...exampleSong, fontSize: 1.5, paragraphSpace: 1.5 } },
};
