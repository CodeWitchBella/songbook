import { createStore, del, entries, get, set } from "idb-keyval";

import type { SongIndex, SongRecord } from "./types";

// Separate IDB database so this store can evolve (or be dropped) without
// touching the older localforage-based caches.
const store = createStore("songbook-song-store", "kv");

const indexKey = "index";
const songKey = (id: string) => `song:${id}`;

export async function readIndex(): Promise<SongIndex> {
  return (await get<SongIndex>(indexKey, store)) ?? {};
}

export async function writeIndex(index: SongIndex): Promise<void> {
  await set(indexKey, index, store);
}

export async function readSong(id: string): Promise<SongRecord | undefined> {
  return await get<SongRecord>(songKey(id), store);
}

export async function writeSong(record: SongRecord): Promise<void> {
  await set(songKey(record.id), record, store);
}

export async function deleteSong(id: string): Promise<void> {
  await del(songKey(id), store);
}

export async function readAllSongs(): Promise<SongRecord[]> {
  const all = await entries<string, SongRecord>(store);
  return all.filter(([key]) => key.startsWith("song:")).map(([, record]) => record);
}
