/// <reference lib="webworker" />
import { expose } from "comlink";

import getFilteredSongList, { type SearchableSong } from "#/sections/song-list/alg";
import { client } from "#/store/client";
import { deleteSong, readAllSongs, readIndex, readSong, writeIndex, writeSong } from "./storage";
import { songStoreChannel, type SongIndex, type SongList, type SongRecord, type SongStoreApi } from "./types";

const FETCH_CONCURRENCY = 5;
const BROADCAST_THROTTLE_MS = 250;
const FETCH_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;

/**
 * In-memory state. The worker is the single writer of the IDB store, so the
 * in-memory index is the source of truth and IDB is just its persistence.
 */
let index: SongIndex = {};
/** Full song data for search; built lazily on first search. */
let searchCache: Map<string, SearchableSong> | null = null;

const ready = (async () => {
  index = await readIndex();
})();

// Index writes are serialized so an earlier (staler) snapshot can never
// overwrite a later one in IDB.
let persistChain = Promise.resolve();
function persistIndex() {
  persistChain = persistChain.then(() => writeIndex(index)).catch(console.error);
}

const channel = new BroadcastChannel(songStoreChannel);
let broadcastTimer: ReturnType<typeof setTimeout> | null = null;
function broadcastChanged() {
  if (broadcastTimer !== null) return;
  broadcastTimer = setTimeout(() => {
    broadcastTimer = null;
    channel.postMessage({ type: "changed" });
  }, BROADCAST_THROTTLE_MS);
}

function isOutdated(entry: { remoteModifiedAt: string; localModifiedAt: string | null }) {
  if (entry.localModifiedAt === null) return true;
  return Date.parse(entry.remoteModifiedAt) > Date.parse(entry.localModifiedAt);
}

function toSearchable(record: SongRecord): SearchableSong {
  return {
    id: record.id,
    title: record.data.title,
    author: record.data.author,
    text: record.data.text ?? "",
    extraSearchable: record.data.extraSearchable,
  };
}

async function removeSong(id: string) {
  if (!(id in index)) return;
  delete index[id];
  searchCache?.delete(id);
  await deleteSong(id).catch(console.error);
  persistIndex();
  broadcastChanged();
}

async function storeFetchedSong(record: SongRecord, remoteModifiedAt?: string) {
  await writeSong(record);
  const localModifiedAt = record.lastModified ?? remoteModifiedAt ?? null;
  index[record.id] = {
    id: record.id,
    remoteModifiedAt: remoteModifiedAt ?? record.lastModified ?? "",
    localModifiedAt,
    slug: record.data.slug,
    title: record.data.title,
    author: record.data.author,
  };
  searchCache?.set(record.id, toSearchable(record));
  persistIndex();
  broadcastChanged();
}

/** Retry transient failures with exponential backoff (1s, 2s, …). */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= FETCH_ATTEMPTS - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, RETRY_BASE_DELAY_MS * 2 ** attempt));
    }
  }
}

/** Returns null on 404 (song gone); throws (after retries) on other failures. */
function fetchSong(query: { slug: string } | { id: string }): Promise<SongRecord | null> {
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

/** Run tasks over items with limited concurrency; failures are per-item. */
async function pool<T>(items: T[], worker: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(FETCH_CONCURRENCY, queue.length) }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) {
        await worker(item).catch(console.error);
      }
    }),
  );
}

let refetchInFlight: Promise<void> | null = null;

/**
 * Full sync pass: pull the remote index, drop songs deleted remotely, then
 * fetch every missing/outdated song body.
 */
function refetch(): Promise<void> {
  if (refetchInFlight) return refetchInFlight;
  refetchInFlight = (async () => {
    const remote = await withRetry(async () => {
      const res = await client.GET("/song");
      if (!res.data) throw new Error(`Failed to load song index (status ${res.response.status})`);
      return res.data.index;
    });

    const remoteIds = new Set(remote.map(entry => entry.id));
    let indexChanged = false;

    // The remote index lists all songs, so anything local it does not mention
    // was deleted on the server.
    for (const id of Object.keys(index)) {
      if (!remoteIds.has(id)) await removeSong(id);
    }

    for (const entry of remote) {
      const existing = index[entry.id];
      if (existing) {
        if (existing.remoteModifiedAt !== entry.modifiedAt) {
          existing.remoteModifiedAt = entry.modifiedAt;
          indexChanged = true;
        }
      } else {
        index[entry.id] = {
          id: entry.id,
          remoteModifiedAt: entry.modifiedAt,
          localModifiedAt: null,
          slug: null,
          title: null,
          author: null,
        };
        indexChanged = true;
      }
    }

    if (indexChanged) {
      persistIndex();
      broadcastChanged();
    }

    const stale = Object.values(index).filter(isOutdated);
    await pool(stale, async entry => {
      const record = await fetchSong({ id: entry.id });
      if (record) await storeFetchedSong(record, entry.remoteModifiedAt);
      // 404: deleted on the server after we loaded its index.
      else await removeSong(entry.id);
    });
  })().finally(() => {
    refetchInFlight = null;
  });
  return refetchInFlight;
}

async function getSearchCache(): Promise<Map<string, SearchableSong>> {
  if (!searchCache) {
    const cache = new Map<string, SearchableSong>();
    for (const record of await readAllSongs()) {
      cache.set(record.id, toSearchable(record));
    }
    if (!searchCache) searchCache = cache;
    // Songs fetched while readAllSongs was in flight may be missing from the
    // snapshot; pull any fetched song the cache does not know about yet.
    for (const entry of Object.values(index)) {
      if (entry.localModifiedAt !== null && !searchCache.has(entry.id)) {
        const record = await readSong(entry.id);
        if (record) searchCache.set(entry.id, toSearchable(record));
      }
    }
  }
  return searchCache;
}

const api: SongStoreApi = {
  async getSongList(): Promise<SongList> {
    await ready;
    const entries = Object.values(index);
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
        outdated: entries.filter(entry => entry.localModifiedAt !== null && isOutdated(entry)).length,
      },
    };
  },

  async searchSongs(text: string) {
    await ready;
    const cache = await getSearchCache();
    return getFilteredSongList([...cache.values()], text);
  },

  async getSong(query) {
    await ready;
    const entry =
      "id" in query ? index[query.id] : Object.values(index).find(candidate => candidate.slug === query.slug);

    if (entry && !isOutdated(entry)) {
      const stored = await readSong(entry.id);
      if (stored) return stored;
    }

    // Cache miss or outdated: try the network, fall back to whatever we have.
    try {
      const record = await fetchSong(query);
      if (record) {
        await storeFetchedSong(record, entry?.remoteModifiedAt);
        return record;
      }
      // 404: the song is gone; drop any local copy instead of serving it.
      if (entry) await removeSong(entry.id);
      return null;
    } catch (error) {
      console.error(error);
    }
    if (entry) return (await readSong(entry.id)) ?? null;
    return null;
  },

  async triggerRefetch() {
    await ready;
    await refetch();
  },
};

// Eagerly sync on worker startup so the whole songbook works offline.
ready.then(() => refetch()).catch(console.error);

declare const self: SharedWorkerGlobalScope;
self.onconnect = event => {
  expose(api, event.ports[0]);
};
