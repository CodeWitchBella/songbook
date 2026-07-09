import { notNull } from "@isbl/ts-utils";
import { DateTime } from "luxon";
import { useCallback, useEffect, useState } from "react";
import xorshift from "xorshift";

import { getSongStore, onSongStoreChange } from "#/worker/client";
import type { ListedSong, SearchResult, SongList, SongListStats } from "#/worker/types";

import type { SongListItem } from "./song-list-look";

export function itemText(song: ListedSong, sortByAuthor: boolean) {
  if (!song.author || !song.title) return song.author || song.title;
  return sortByAuthor ? `${song.author} - ${song.title}` : `${song.title} - ${song.author}`;
}

/**
 * Turn a worker song list (+ optional search result) into the flat item list
 * `SongListLook` renders. `results === null` means "no search": every id in
 * `orderedIds`, no category headers.
 */
export function buildList(
  byId: Map<string, ListedSong>,
  results: SearchResult | null,
  orderedIds: string[],
  sortByAuthor: boolean,
  filter?: (id: string) => boolean,
): SongListItem[] {
  const toItem = (id: string): SongListItem => {
    if (filter && !filter(id)) return null;
    const song = byId.get(id);
    if (!song) return null;
    return { text: itemText(song, sortByAuthor), slug: song.slug };
  };

  if (!results) return orderedIds.map(toItem).filter(notNull);

  return [
    results.byTitle.length > 0 ? ({ header: "title" } as const) : null,
    ...results.byTitle.map(toItem),
    results.byAuthor.length > 0 ? ({ header: "author" } as const) : null,
    ...results.byAuthor.map(toItem),
    results.byText.length > 0 ? ({ header: "text" } as const) : null,
    ...results.byText.map(toItem),
    results.byExtra.length > 0 ? ({ header: "other" } as const) : null,
    ...results.byExtra.map(toItem),
  ].filter(notNull);
}

export function compareListed(sortByAuthor: boolean) {
  return (a: ListedSong, b: ListedSong) => {
    const first = sortByAuthor ? a.author.localeCompare(b.author) : a.title.localeCompare(b.title);
    if (first !== 0) return first;
    return sortByAuthor ? a.title.localeCompare(b.title) : a.author.localeCompare(b.author);
  };
}

const emptyList: SongList = { songs: [], stats: { total: 0, unfetched: 0, outdated: 0 } };

/** Client-side subscription to the shared worker's song list. */
export function useWorkerSongList(): { songs: ListedSong[]; stats: SongListStats } {
  const [state, setState] = useState<SongList>(emptyList);
  useEffect(() => {
    let alive = true;
    const load = () =>
      getSongStore()
        .getSongList()
        .then(v => {
          if (alive) setState(v);
        });
    load();
    const off = onSongStoreChange(load);
    return () => {
      alive = false;
      off();
    };
  }, []);
  return state;
}

/** Search results for `q`, or null while `q` is empty. Re-runs on worker changes. */
export function useWorkerSearch(q: string): SearchResult | null {
  const [results, setResults] = useState<SearchResult | null>(null);
  useEffect(() => {
    if (!q) {
      setResults(null);
      return undefined;
    }
    let alive = true;
    const run = () =>
      getSongStore()
        .searchSongs(q)
        .then(v => {
          if (alive) setResults(v);
        });
    run();
    const off = onSongStoreChange(run);
    return () => {
      alive = false;
      off();
    };
  }, [q]);
  return results;
}

/**
 * Same-day-stable "next random song": everyone gets the same shuffle order
 * for a given calendar day (seeded off the date), so repeatedly hitting
 * "random" walks forward through it instead of jumping around.
 */
export function useGetRandomSong() {
  return useCallback(async (currentSongId: string): Promise<ListedSong | null> => {
    const { songs } = await getSongStore().getSongList();
    if (songs.length === 0) return null;
    const nowReal = DateTime.utc();
    const now = nowReal.get("hour") < 3 ? nowReal.minus({ day: 1 }) : nowReal;
    const seed = [now.get("day"), now.get("month"), now.get("year"), 0];
    const random = new xorshift.constructor(seed);
    const withRandom = [...songs]
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map(song => ({ song, number: random.random() }));
    const curRandom = withRandom.find(s => s.song.id === currentSongId);
    if (!curRandom) return songs[Math.floor(Math.random() * songs.length)];
    const next = withRandom.reduce(
      (cur, t) => {
        if (t.number < curRandom.number) return cur;
        if (t.song.id === currentSongId) return cur;
        if (!cur) return t;
        return cur.number < t.number ? cur : t;
      },
      null as null | (typeof withRandom)[0],
    );
    if (next) return next.song;
    return withRandom.reduce(
      (a, b) => (a === null ? b : a.number < b.number ? a : b),
      null as null | (typeof withRandom)[0],
    )!.song;
  }, []);
}
