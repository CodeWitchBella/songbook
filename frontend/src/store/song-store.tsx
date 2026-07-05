import localForage from "localforage";
import { createStore, type StoreApi } from "zustand";
import { retryingNetworkLoad } from "./promise-queues";
import { captureException } from "@sentry/react";
import PQueue from "p-queue";

// ------------ SONG FETCHING -----------------

/**
 * Absolute minimum info about songs to:
 * - render song list
 * - for the store to work
 */
type SongIndex = {
  id: string;
  modifiedAt: string;

  slug: string;
  title: string;
  author: string;
};

type SongDetails = {
  id: string;
  modifiedAt: string;

  slug: string;
  title: string;
  author: string;

  text: string;
  fontSize: number;
  paragraphSpace: number;
  titleSpace: number;
  pretranspose: number;
  spotify: string | null;
  extraSearchable: string | null;
  extraNonSearchable: string | null;
};

function todo(): never {
  throw new Error("To be implemented");
}

function fetchSongById(id: string): Promise<SongDetails> {
  todo();
}

function fetchIndex(): Promise<SongIndex[]> {
  todo();
}

type InfoModified = { id: string; modifiedAt: string; slug?: string; title?: string; author?: string };

type InfoChanges = {
  deleted: readonly { id: string; modifiedAt: string }[];
  modified: readonly InfoModified[];
  new: readonly SongIndex[];
};

function fetchChangedSongsSince(since: string): Promise<InfoChanges> {
  todo();
}

// ------------ THE STORE ---------------

// type Store = {
//   details: Record<string, SongDetails> /* id -> Song */;
//   unslug: Record<string, string> /* slug -> id */;
// };

type IndexStore = {
  index: readonly SongIndex[];
  newestModifiedAt: string;
  setIndex: (v: readonly SongIndex[]) => void;
  appendIndex: (changes: InfoChanges) => void;
};

type SongStore = {
  songs: { [id: string]: SongDetails | undefined };
  loading: { [id: string]: boolean };
  add: (song: SongDetails) => void;
  delete: (ids: readonly string[]) => void;
  setLoading: (id: string, loading: boolean) => void;
};

function newestModifiedAt(items: readonly { modifiedAt: string }[], start = ""): string {
  return items.reduce((acc, item) => (item.modifiedAt > acc ? item.modifiedAt : acc), start);
}

async function prepareIndexStore(): Promise<StoreApi<IndexStore>> {
  const indexStorage = localForage.createInstance({ name: "songs", storeName: "info", version: 1 });
  let index: SongIndex[] | null = null;
  try {
    index = await indexStorage.getItem<SongIndex[]>("index");
  } catch (e) {
    catcher(e);
  }
  if (!index) {
    index = await retryingNetworkLoad(fetchIndex);
    await indexStorage.setItem<SongIndex[]>("index", index).catch(catcher);
  }
  const store = createStore<IndexStore>(set => ({
    index,
    newestModifiedAt: newestModifiedAt(index),

    setIndex: v => set({ index: v, newestModifiedAt: newestModifiedAt(v) }),
    appendIndex: v =>
      set(prev => {
        const deleted = new Set(v.deleted.map(d => d.id));
        const modified = new Map<string, InfoModified>(v.modified.map(v => [v.id, v]));
        const added = new Map(v.new.filter(song => !deleted.has(song.id)).map(song => [song.id, song]));
        return {
          index: prev.index
            .filter(song => !deleted.has(song.id))
            .map(song => {
              const modification = modified.get(song.id);
              if (modification) {
                song = {
                  ...song,
                  slug: modification.slug ?? song.slug,
                  title: modification.title ?? song.title,
                  author: modification.author ?? song.author,
                  modifiedAt: modification.modifiedAt,
                };
              }
              const addition = added.get(song.id);
              if (addition) {
                added.delete(song.id);
                if (addition.modifiedAt > song.modifiedAt) return addition;
              }
              return song;
            })
            .concat([...added.values()]),
          newestModifiedAt: newestModifiedAt(
            v.new,
            newestModifiedAt(v.modified, newestModifiedAt(v.deleted, prev.newestModifiedAt)),
          ),
        };
      }),
  }));
  const savingQueue = new PQueue({ concurrency: 1 });
  store.subscribe(snapshot => {
    savingQueue
      .add(() => indexStorage.setItem<readonly SongIndex[]>("index", snapshot.index))
      .catch(err => {
        console.error(err);
        captureException(err);
      });
  });
  return store;
}

export async function prepareStore() {
  const index = await prepareIndexStore();
  const songs = createStore<SongStore>(set => ({
    songs: {},
    loading: {},
    add: song => set(prev => (prev.songs[song.id] === song ? prev : { songs: { ...prev.songs, [song.id]: song } })),
    delete: ids =>
      set(prev => {
        const nextSongs = { ...prev.songs };
        const nextLoading = { ...prev.loading };
        for (const id of ids) {
          delete nextSongs[id];
          delete nextLoading[id];
        }
        return { songs: nextSongs, loading: nextLoading };
      }),
    setLoading: (id, value) => set(prev => ({ loading: { ...prev.loading, [id]: value } })),
  }));

  const refreshQ = new PQueue({ concurrency: 1, intervalCap: 1, interval: 1000 });
  let latestRefresh = Promise.resolve();
  const refreshIndex = () => {
    if (refreshQ.size) return latestRefresh;
    latestRefresh = refreshQ.add(async () => {
      const indexVal = index.getState();
      const changes = await fetchChangedSongsSince(indexVal.newestModifiedAt);
      index.getState().appendIndex(changes);
      songs.getState().delete(changes.deleted.map(d => d.id));
      for (const deleted of changes.deleted) {
        songStorage.removeItem(deleted.id).catch(catcher);
      }
    });
    latestRefresh.catch(catcher);
    return latestRefresh;
  };

  const songStorage = localForage.createInstance({ name: "songs", storeName: "song", version: 1 });
  async function requestSongInner(id: string) {
    const state = songs.getState();
    let song = state.songs[id] ?? null;
    let songIndex = index.getState().index.find(s => s.id === id);
    if (!songIndex) throw new Error(`Unknown song id ${id}`);
    if (song && song.modifiedAt >= songIndex.modifiedAt) return song; // already at latest (or newer)

    state.setLoading(id, true);

    // load from local store
    try {
      if (!song) {
        song = await songStorage.getItem(id);
      }
    } catch (e) {
      catcher(e);
    }
    try {
      songIndex = index.getState().index.find(s => s.id === id);
      if (!songIndex) throw new Error(`Unknown song id ${id}`); // deleted in the meantime
      if (song) state.add(song);
      if (song && song.modifiedAt >= songIndex.modifiedAt) return song; // already at latest (or newer)

      // refresh from network
      song = await fetchSongById(id);
      songIndex = index.getState().index.find(s => s.id === id);
      if (!songIndex) throw new Error(`Unknown song id ${id}`); // deleted in the meantime
      if (song) {
        state.add(song);
        songStorage.setItem(id, song).catch(catcher);
      }
      return song;
    } finally {
      state.setLoading(id, false);
    }
  }

  const requestQ = new Map<string, PQueue>();
  function enqueueSong(id: string) {
    const queue = getOrInsertComputed(requestQ, id, () => {
      const q = new PQueue({ concurrency: 1, interval: 1000, intervalCap: 1 });
      q.on("idle", () => {
        if (requestQ.get(id) === q && q.size === 0 && q.pending === 0) requestQ.delete(id);
      });
      return q;
    });
    if (queue.size > 0) return;
    return queue.add(() => requestSongInner(id)).catch(catcher);
  }
  const requestSong = (id: string) => void enqueueSong(id);

  const prefetchQ = new PQueue({ concurrency: 4 });
  const prefetchAll = () => {
    for (const song of index.getState().index.toSorted((a, b) => a.modifiedAt.localeCompare(b.modifiedAt))) {
      const q = requestQ.get(song.id);
      if (q && q.size > 0) continue; // already queued for revalidate
      prefetchQ.add(() => Promise.resolve().then(() => enqueueSong(song.id)), {
        // run the non-pending stuff first
        priority: q?.isRateLimited || q?.pending ? -1 : 0,
      });
    }
  };
  prefetchAll();
  // TODO: drive this from changes instead so that we don't have to do O(n2) search
  index.subscribe(prefetchAll);

  return {
    index,
    refreshIndex,
    songs,
    requestSong,
  };
}

/**
 * Ponyfill for Map.prototype.getOrInsertComputed (TC39 upsert proposal), which
 * our browserslist targets do not all support yet. Once they do, delete this
 * and change the call site back to map.getOrInsertComputed(key, compute).
 */
function getOrInsertComputed<K, V>(map: Map<K, V>, key: K, compute: (key: K) => V): V {
  if (map.has(key)) return map.get(key)!;
  const value = compute(key);
  map.set(key, value);
  return value;
}

function catcher(e: unknown) {
  console.error(e);
  captureException(e);
  return null;
}
