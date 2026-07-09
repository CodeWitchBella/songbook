/// <reference lib="webworker" />
import { expose, proxy } from "comlink";

import getFilteredSongList, { type SearchableSong } from "#/sections/song-list/alg";
import { client } from "#/store/client";
import {
  deleteCollection,
  deleteSong,
  readAllSongs,
  readCollection,
  readCollectionIndex,
  readIndex,
  readSong,
  writeCollection,
  writeCollectionIndex,
  writeIndex,
  writeSong,
} from "./storage";
import {
  collectionStoreChannel,
  songStoreChannel,
  type CollectionIndex,
  type CollectionList,
  type CollectionRecord,
  type CollectionStoreApi,
  type SongIndex,
  type SongList,
  type SongRecord,
  type SongStoreApi,
} from "./types";

const DEFAULT_FETCH_CONCURRENCY = 5;
const DEFAULT_BROADCAST_THROTTLE_MS = 250;
const DEFAULT_FETCH_ATTEMPTS = 3;
const DEFAULT_RETRY_BASE_DELAY_MS = 1000;

/** Denormalized per-entity entry stored in the single index key. */
type IndexEntryBase = {
  id: string;
  /** lastModified reported by the remote index. */
  remoteModifiedAt: string;
  /** lastModified of the locally stored record; null = body not fetched yet. */
  localModifiedAt: string | null;
};

/**
 * Config for a single entity store: how to reach the remote API, how to
 * persist to IDB, and how to fold a fetched record into its index entry.
 * One worker (this file) can host several such stores side by side.
 */
type EntityStoreConfig<Query, Entry extends IndexEntryBase, RecordT extends { id: string }, RemoteEntry> = {
  channelName: string;
  fetchAttempts?: number;
  retryBaseDelayMs?: number;
  fetchConcurrency?: number;
  broadcastThrottleMs?: number;

  storage: {
    readIndex(): Promise<Record<string, Entry>>;
    writeIndex(index: Record<string, Entry>): Promise<void>;
    readRecord(id: string): Promise<RecordT | undefined>;
    writeRecord(record: RecordT): Promise<void>;
    deleteRecord(id: string): Promise<void>;
  };

  /** Fetch the remote list of entries for a full sync pass. */
  fetchRemoteIndex(): Promise<RemoteEntry[]>;
  remoteId(entry: RemoteEntry): string;
  remoteModifiedAt(entry: RemoteEntry): string;
  /** Build a fresh index entry for an id we've never seen locally before. */
  createEntry(id: string, remoteModifiedAt: string, remoteEntry: RemoteEntry): Entry;

  /**
   * Fetch a single record's full body. Null return = confirmed gone (404).
   * `entry` is the locally known index entry (if any), useful when the
   * remote API can only be queried by a field the query itself lacks (e.g.
   * looking up by id when only a by-slug endpoint exists).
   */
  fetchRecord(query: Query, entry: Entry | undefined): Promise<RecordT | null>;
  /** Find the locally known index entry (if any) matching a query. */
  findEntry(index: Record<string, Entry>, query: Query): Entry | undefined;
  /** Merge a freshly-fetched record into its (possibly missing) index entry. */
  toIndexEntry(record: RecordT, remoteModifiedAt: string | undefined, previous: Entry | undefined): Entry;

  /** Hooks for callers that keep derived state (e.g. a search cache) in sync. */
  onStored?(record: RecordT): void;
  onRemoved?(id: string): void;
};

/** Run tasks over items with limited concurrency; failures are per-item. */
async function pool<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) {
        await worker(item).catch(console.error);
      }
    }),
  );
}

/**
 * Generic offline-first store: a single-writer in-memory index backed by
 * IDB, kept fresh by polling a remote index and lazily fetching bodies.
 * The worker is the single writer, so the in-memory index is the source of
 * truth and IDB is just its persistence.
 */
function createEntityStore<Query, Entry extends IndexEntryBase, RecordT extends { id: string }, RemoteEntry>(
  config: EntityStoreConfig<Query, Entry, RecordT, RemoteEntry>,
) {
  const fetchAttempts = config.fetchAttempts ?? DEFAULT_FETCH_ATTEMPTS;
  const retryBaseDelayMs = config.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;
  const fetchConcurrency = config.fetchConcurrency ?? DEFAULT_FETCH_CONCURRENCY;
  const broadcastThrottleMs = config.broadcastThrottleMs ?? DEFAULT_BROADCAST_THROTTLE_MS;

  let index: Record<string, Entry> = {};

  const ready = (async () => {
    index = await config.storage.readIndex();
  })();

  // Index writes are serialized so an earlier (staler) snapshot can never
  // overwrite a later one in IDB.
  let persistChain = Promise.resolve();
  function persistIndex() {
    persistChain = persistChain.then(() => config.storage.writeIndex(index)).catch(console.error);
  }

  const channel = new BroadcastChannel(config.channelName);
  let broadcastTimer: ReturnType<typeof setTimeout> | null = null;
  function broadcastChanged() {
    if (broadcastTimer !== null) return;
    broadcastTimer = setTimeout(() => {
      broadcastTimer = null;
      channel.postMessage({ type: "changed" });
    }, broadcastThrottleMs);
  }

  function isOutdated(entry: IndexEntryBase) {
    if (entry.localModifiedAt === null) return true;
    return Date.parse(entry.remoteModifiedAt) > Date.parse(entry.localModifiedAt);
  }

  /** Retry transient failures with exponential backoff (1s, 2s, …). */
  async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt >= fetchAttempts - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, retryBaseDelayMs * 2 ** attempt));
      }
    }
  }

  async function removeEntry(id: string) {
    if (!(id in index)) return;
    delete index[id];
    config.onRemoved?.(id);
    await config.storage.deleteRecord(id).catch(console.error);
    persistIndex();
    broadcastChanged();
  }

  async function storeFetchedRecord(record: RecordT, remoteModifiedAt?: string) {
    await config.storage.writeRecord(record);
    index[record.id] = config.toIndexEntry(record, remoteModifiedAt, index[record.id]);
    config.onStored?.(record);
    persistIndex();
    broadcastChanged();
  }

  let refetchInFlight: Promise<void> | null = null;

  /**
   * Full sync pass: pull the remote index, drop entries deleted remotely,
   * then fetch every missing/outdated record body.
   */
  function refetch(): Promise<void> {
    if (refetchInFlight) return refetchInFlight;
    refetchInFlight = (async () => {
      const remote = await withRetry(() => config.fetchRemoteIndex());

      const remoteIds = new Set(remote.map(entry => config.remoteId(entry)));
      let indexChanged = false;

      // The remote index lists everything, so anything local it does not
      // mention was deleted on the server.
      for (const id of Object.keys(index)) {
        if (!remoteIds.has(id)) await removeEntry(id);
      }

      for (const remoteEntry of remote) {
        const id = config.remoteId(remoteEntry);
        const remoteModifiedAt = config.remoteModifiedAt(remoteEntry);
        const existing = index[id];
        if (existing) {
          if (existing.remoteModifiedAt !== remoteModifiedAt) {
            existing.remoteModifiedAt = remoteModifiedAt;
            indexChanged = true;
          }
        } else {
          index[id] = config.createEntry(id, remoteModifiedAt, remoteEntry);
          indexChanged = true;
        }
      }

      if (indexChanged) {
        persistIndex();
        broadcastChanged();
      }

      const stale = Object.values(index).filter(isOutdated);
      await pool(stale, fetchConcurrency, async entry => {
        const record = await config.fetchRecord({ id: entry.id } as Query, entry);
        if (record) await storeFetchedRecord(record, entry.remoteModifiedAt);
        // 404: deleted on the server after we loaded its index.
        else await removeEntry(entry.id);
      });
    })().finally(() => {
      refetchInFlight = null;
    });
    return refetchInFlight;
  }

  async function getRecord(query: Query): Promise<RecordT | null> {
    await ready;
    const entry = config.findEntry(index, query);

    if (entry && !isOutdated(entry)) {
      const stored = await config.storage.readRecord(entry.id);
      if (stored) return stored;
    }

    // Cache miss or outdated: try the network, fall back to whatever we have.
    try {
      const record = await config.fetchRecord(query, entry);
      if (record) {
        await storeFetchedRecord(record, entry?.remoteModifiedAt);
        return record;
      }
      // 404: the entity is gone; drop any local copy instead of serving it.
      if (entry) await removeEntry(entry.id);
      return null;
    } catch (error) {
      console.error(error);
    }
    if (entry) return (await config.storage.readRecord(entry.id)) ?? null;
    return null;
  }

  async function triggerRefetch() {
    await ready;
    await refetch();
  }

  // Eagerly sync on startup so the store works offline from then on.
  ready.then(() => refetch()).catch(console.error);

  return {
    ready,
    getIndex: () => index,
    isOutdated,
    getRecord,
    triggerRefetch,
  };
}

type SongQuery = { slug: string } | { id: string };
type SongRemoteEntry = { id: string; modifiedAt: string };
type SongEntityStore = ReturnType<typeof createEntityStore<SongQuery, SongIndex[string], SongRecord, SongRemoteEntry>>;

function toSearchable(record: SongRecord): SearchableSong {
  return {
    id: record.id,
    title: record.data.title,
    author: record.data.author,
    text: record.data.text ?? "",
    extraSearchable: record.data.extraSearchable,
  };
}

/** Retry transient failures with exponential backoff (1s, 2s, …). */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= DEFAULT_FETCH_ATTEMPTS - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, DEFAULT_RETRY_BASE_DELAY_MS * 2 ** attempt));
    }
  }
}

/** Returns null on 404 (song gone); throws (after retries) on other failures. */
function fetchSong(query: SongQuery): Promise<SongRecord | null> {
  return withRetry(async () => {
    const res =
      "id" in query
        ? await client.GET("/song/by-id/{id}", { params: { path: { id: query.id } } })
        : await client.GET("/song/by-slug/{slug}", { params: { path: { slug: query.slug } } });
    if (res.data) return res.data;
    if (res.response.status === 404) return null;
    throw new Error(`Failed to fetch song (status ${res.response.status})`);
  });
}

/** Full song data for search; built lazily on first search. */
let searchCache: Map<string, SearchableSong> | null = null;

async function getSearchCache(songStore: SongEntityStore): Promise<Map<string, SearchableSong>> {
  if (!searchCache) {
    const cache = new Map<string, SearchableSong>();
    for (const record of await readAllSongs()) {
      cache.set(record.id, toSearchable(record));
    }
    if (!searchCache) searchCache = cache;
    // Songs fetched while readAllSongs was in flight may be missing from the
    // snapshot; pull any fetched song the cache does not know about yet.
    for (const entry of Object.values(songStore.getIndex())) {
      if (entry.localModifiedAt !== null && !searchCache.has(entry.id)) {
        const record = await readSong(entry.id);
        if (record) searchCache.set(entry.id, toSearchable(record));
      }
    }
  }
  return searchCache;
}

const songStore: SongEntityStore = createEntityStore<SongQuery, SongIndex[string], SongRecord, SongRemoteEntry>({
  channelName: songStoreChannel,
  storage: {
    readIndex,
    writeIndex,
    readRecord: readSong,
    writeRecord: writeSong,
    deleteRecord: deleteSong,
  },
  fetchRemoteIndex: async () => {
    const res = await client.GET("/song");
    if (!res.data) throw new Error(`Failed to load song index (status ${res.response.status})`);
    return res.data.index;
  },
  remoteId: entry => entry.id,
  remoteModifiedAt: entry => entry.modifiedAt,
  createEntry: (id, remoteModifiedAt) => ({
    id,
    remoteModifiedAt,
    localModifiedAt: null,
    slug: null,
    title: null,
    author: null,
  }),
  fetchRecord: fetchSong,
  findEntry: (index, query) =>
    "id" in query ? index[query.id] : Object.values(index).find(candidate => candidate.slug === query.slug),
  toIndexEntry: (record, remoteModifiedAt, previous) => ({
    id: record.id,
    remoteModifiedAt: remoteModifiedAt ?? record.lastModified ?? previous?.remoteModifiedAt ?? "",
    localModifiedAt: record.lastModified ?? remoteModifiedAt ?? null,
    slug: record.data.slug,
    title: record.data.title,
    author: record.data.author,
  }),
  onStored: record => searchCache?.set(record.id, toSearchable(record)),
  onRemoved: id => searchCache?.delete(id),
});

type CollectionQuery = { slug: string } | { id: string };
type CollectionRemoteEntry = { id: string; modifiedAt: string };

function fetchCollection(query: CollectionQuery): Promise<CollectionRecord | null> {
  return withRetry(async () => {
    const res =
      "id" in query
        ? await client.GET("/collections/by-id/{id}", { params: { path: { id: query.id } } })
        : await client.GET("/collections/by-slug/{slug}", { params: { path: { slug: query.slug } } });
    if (res.data) {
      const { songList, ...data } = res.data.data;
      return { ...res.data, data: { ...data, songIds: songList.map(song => song.id) } };
    }
    if (res.response.status === 404) return null;
    throw new Error(`Failed to fetch collection (status ${res.response.status})`);
  });
}

const collectionStore = createEntityStore<
  CollectionQuery,
  CollectionIndex[string],
  CollectionRecord,
  CollectionRemoteEntry
>({
  channelName: collectionStoreChannel,
  storage: {
    readIndex: readCollectionIndex,
    writeIndex: writeCollectionIndex,
    readRecord: readCollection,
    writeRecord: writeCollection,
    deleteRecord: deleteCollection,
  },
  fetchRemoteIndex: async () => {
    const res = await client.GET("/collections");
    if (!res.data) throw new Error(`Failed to load collection index (status ${res.response.status})`);
    return res.data.index;
  },
  remoteId: entry => entry.id,
  remoteModifiedAt: entry => entry.modifiedAt,
  createEntry: (id, remoteModifiedAt) => ({
    id,
    remoteModifiedAt,
    localModifiedAt: null,
    slug: null,
    name: null,
    owner: null,
  }),
  fetchRecord: fetchCollection,
  findEntry: (index, query) =>
    "id" in query ? index[query.id] : Object.values(index).find(candidate => candidate.slug === query.slug),
  toIndexEntry: (record, remoteModifiedAt, previous) => ({
    id: record.id,
    remoteModifiedAt: remoteModifiedAt ?? record.lastModified ?? previous?.remoteModifiedAt ?? "",
    localModifiedAt: record.lastModified ?? remoteModifiedAt ?? null,
    slug: record.data.slug,
    name: record.data.name,
    owner: record.data.owner,
  }),
});

const collectionApi: CollectionStoreApi = {
  async getCollectionList(): Promise<CollectionList> {
    await collectionStore.ready;
    const entries = Object.values(collectionStore.getIndex());
    const collections = entries
      .filter(entry => entry.slug !== null)
      .map(entry => ({ id: entry.id, slug: entry.slug!, name: entry.name ?? "", owner: entry.owner }))
      .sort((a, b) => a.name.localeCompare(b.name, "cs"));
    return {
      collections,
      stats: {
        total: entries.length,
        unfetched: entries.filter(entry => entry.localModifiedAt === null).length,
        outdated: entries.filter(entry => entry.localModifiedAt !== null && collectionStore.isOutdated(entry)).length,
      },
    };
  },

  getCollection: query => collectionStore.getRecord(query),

  triggerRefetch: () => collectionStore.triggerRefetch(),
};

const api: SongStoreApi = {
  async getSongList(): Promise<SongList> {
    await songStore.ready;
    const entries = Object.values(songStore.getIndex());
    const songs = entries
      .filter(entry => entry.slug !== null)
      .map(entry => ({
        id: entry.id,
        slug: entry.slug!,
        title: entry.title ?? "",
        author: entry.author ?? "",
      }))
      .sort((a, b) => a.title.localeCompare(b.title, "cs"));
    return {
      songs,
      stats: {
        total: entries.length,
        unfetched: entries.filter(entry => entry.localModifiedAt === null).length,
        outdated: entries.filter(entry => entry.localModifiedAt !== null && songStore.isOutdated(entry)).length,
      },
    };
  },

  async searchSongs(text: string) {
    await songStore.ready;
    const cache = await getSearchCache(songStore);
    return getFilteredSongList([...cache.values()], text);
  },

  getSong: query => songStore.getRecord(query),

  triggerRefetch: () => songStore.triggerRefetch(),
};

const root = { song: proxy(api), collection: proxy(collectionApi) };
export type WorkerApi = typeof root;

declare const self: SharedWorkerGlobalScope;
self.onconnect = event => {
  expose(root, event.ports[0]);
};
