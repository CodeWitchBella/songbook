import { DateTime } from "luxon";

import type { User } from "./api";
import { restUpdateSong } from "./api";
import type { SongRecord } from "#/worker/types";

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

export function toSongType(record: SongRecord): SongType {
  const { data } = record;
  return {
    id: record.id,
    lastModified: record.lastModified ? DateTime.fromISO(record.lastModified) : DateTime.now(),
    slug: data.slug,
    author: data.author,
    title: data.title,
    text: data.text ?? "",
    fontSize: data.fontSize ?? 0,
    paragraphSpace: data.paragraphSpace ?? 0,
    titleSpace: data.titleSpace ?? 0,
    spotify: data.spotify,
    pretranspose: data.pretranspose ?? 0,
    extraSearchable: data.extraSearchable,
    extraNonSearchable: data.extraNonSearchable,
    editor: data.editor as unknown as User | null,
    insertedAt: data.insertedAt ? DateTime.fromISO(data.insertedAt) : null,
  };
}
