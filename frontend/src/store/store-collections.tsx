import { DateTime } from "luxon";

import { GenericStore } from "./generic-store";
import type { User } from "./api";
import { restFetch } from "./api";

type CollectionRecord<DT = DateTime> = {
  id: string;
  lastModified: DT;

  slug: string;
  name: string;
  owner: User;
  songList: readonly string[];
  insertedAt: DT;
  locked: boolean;
};

async function collectionQuery(modifiedAfter?: DateTime): Promise<{
  changed: CollectionRecord[];
  deleted: { id: string }[];
}> {
  return restFetch("collections", {
    modifiedAfter: modifiedAfter ? modifiedAfter.toISO() : null,
  }).then(v => {
    const deleted = v.data.collections.filter((c: any) => c.__typename === "Deleted").map((c: any) => ({ id: c.id }));
    const changed = v.data.collections
      .filter((c: any) => c.__typename === "CollectionRecord")
      .map((c: any) => ({
        ...c.data,
        songList: c.data.songList.map((s: { id: string }) => s.id),
        lastModified: DateTime.fromISO(c.lastModified),
        insertedAt: DateTime.fromISO(c.data.insertedAt),
        id: c.id,
      }));
    return { deleted, changed };
  });
}

export type CollectionType = CollectionRecord<DateTime>;

export function createCollectionStore() {
  return new GenericStore<CollectionType, CollectionRecord<string>>({
    cacheKey: "collections",
    version: 2,
    serialize: item => {
      return {
        ...item,
        lastModified: item.lastModified.toISO()!, // <- todo fixme
        insertedAt: item.insertedAt.toISO()!, // <- todo fixme
      };
    },
    deserialize: item => {
      return {
        ...item,
        lastModified: DateTime.fromISO(item.lastModified),
        insertedAt: DateTime.fromISO(item.insertedAt),
      };
    },
    loadIncremental: after => collectionQuery(after),
    loadInitial: () =>
      collectionQuery().then(v => {
        return v.changed;
      }),
  });
}
