import type { components } from "#/store/api-schema";

// The generated schema types `editor` as `RestUser & (Record<string, never> | null)`
// (an openapi-typescript artifact for nullable $refs) which is impossible to
// assign to; spell out what it actually means.
type RawSongRecord = components["schemas"]["SongRecord"];
export type SongRecord = Omit<RawSongRecord, "data"> & {
  data: Omit<RawSongRecord["data"], "editor"> & {
    editor: components["schemas"]["RestUser"] | null;
  };
};

/** Denormalized per-song entry stored in the single index key. */
export type SongIndexEntry = {
  id: string;
  /** lastModified reported by the remote index (GET /song). */
  remoteModifiedAt: string;
  /** lastModified of the locally stored record; null = song body not fetched yet. */
  localModifiedAt: string | null;
  // Filled in from song data once the body is fetched, so listing does not
  // have to read every song key.
  slug: string | null;
  title: string | null;
  author: string | null;
};

export type SongIndex = Record<string, SongIndexEntry>;

export type ListedSong = {
  id: string;
  slug: string;
  title: string;
  author: string;
};

export type SongListStats = {
  total: number;
  unfetched: number;
  outdated: number;
};

export type SongList = {
  songs: ListedSong[];
  stats: SongListStats;
};

/** Ids grouped by which field matched, mirroring sections/song-list/alg. */
export type SearchResult = {
  byTitle: string[];
  byAuthor: string[];
  byText: string[];
  byExtra: string[];
};

export type SongStoreApi = {
  getSongList(): Promise<SongList>;
  searchSongs(text: string): Promise<SearchResult>;
  getSong(query: { slug: string } | { id: string }): Promise<SongRecord | null>;
  triggerRefetch(): Promise<void>;
};

/** BroadcastChannel name; every message means "something changed, re-ask". */
export const songStoreChannel = "songbook-song-store";

// The generated schema types `owner` the same way it types song's `editor`
// (a nullable $ref becomes an impossible-to-satisfy intersection); spell out
// what it actually means. `data` is also declared optional even though a
// successful response always includes it.
type RawCollectionDetail = NonNullable<components["schemas"]["CollectionDetail"]["data"]>;
export type CollectionRecord = {
  id: string;
  lastModified: string | null;
  data: Omit<RawCollectionDetail, "owner"> & { owner: components["schemas"]["RestUser"] | null };
};

/** Denormalized per-collection entry stored in the single index key. */
export type CollectionIndexEntry = {
  id: string;
  /** lastModified reported by the remote index (POST /collections). */
  remoteModifiedAt: string;
  /** lastModified of the locally stored record; null = song list not fetched yet. */
  localModifiedAt: string | null;
  slug: string | null;
  name: string | null;
};

export type CollectionIndex = Record<string, CollectionIndexEntry>;

export type ListedCollection = {
  id: string;
  slug: string;
  name: string;
};

export type CollectionList = {
  collections: ListedCollection[];
  stats: SongListStats;
};

export type CollectionStoreApi = {
  getCollectionList(): Promise<CollectionList>;
  getCollection(query: { slug: string } | { id: string }): Promise<CollectionRecord | null>;
  triggerRefetch(): Promise<void>;
};

/** BroadcastChannel name; every message means "something changed, re-ask". */
export const collectionStoreChannel = "songbook-collection-store";
