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
  deleted: readonly string[];
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
        const deleted = new Set(v.deleted);
        const modified = new Map<string, InfoModified>(v.modified.map(v => [v.id, v]));
        return {
          index: prev.index
            .filter(song => !deleted.has(song.id))
            .map(song => {
              const modification = modified.get(song.id);
              if (!modification) return song;
              return {
                ...song,
                slug: modification.slug ?? song.slug,
                title: modification.title ?? song.title,
                author: modification.author ?? song.author,
                modifiedAt: modification.modifiedAt,
              };
            })
            .concat(v.new),
          newestModifiedAt: newestModifiedAt(v.new, newestModifiedAt(v.modified, prev.newestModifiedAt)),
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

async function prepareStore() {
  const index = await prepareIndexStore();
  const songs = createStore<SongStore>(set => ({
    songs: {},
    loading: {},
    add: song => set(prev => (prev.songs[song.id] === song ? {} : { songs: { ...prev.songs, [song.id]: song } })),
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
      songs.getState().delete(changes.deleted);
      for (const deleted of changes.deleted) {
        songStorage.removeItem(deleted).catch(catcher);
      }
      index.getState().appendIndex(changes);
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
  function requestSong(id: string) {
    const queue = requestQ.getOrInsertComputed(id, () => {
      const q = new PQueue({ concurrency: 1, interval: 1000, intervalCap: 1 });
      q.on("idle", () => {
        if (requestQ.get(id) === q && q.size === 0 && q.pending === 0) requestQ.delete(id);
      });
      return q;
    });
    if (queue.size > 0) return;
    queue.add(() => requestSongInner(id)).catch(catcher);
  }

  return {
    index,
    refreshIndex,
    songs,
    requestSong,
  };
}
export const store = prepareStore();

function catcher(e: unknown) {
  console.error(e);
  captureException(e);
  return null;
}
