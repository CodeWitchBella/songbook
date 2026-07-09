import type { DateTime } from "luxon";

import type { User } from "./api";
import { restUpdateSong } from "./api";

export async function updateSong(
  id: string,
  input: {
    slug?: string;
    author?: string;
    title?: string;
    text?: string;
    fontSize?: number;
    paragraphSpace?: number;
    titleSpace?: number;
    extraSearchable?: string;
    extraNonSearchable?: string;
    spotify?: string;
    pretranspose?: number;
  },
) {
  return restUpdateSong(id, input).then(v => {
    if (!v.updateSong) throw new Error("updateSong failed");
  });
}

type Song<DT> = {
  slug: string;
  id: string;
  lastModified: DT;
  text: string;
  fontSize: number;
  paragraphSpace: number;
  titleSpace: number;
  spotify: string | null;
  pretranspose: number;
  editor: User | null;
  insertedAt: DT | null;
  author: string;
  title: string;
  extraSearchable: string | null;
  extraNonSearchable: string | null;
};

export type SongType = Song<DateTime>;
