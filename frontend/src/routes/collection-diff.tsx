import { PageHeader } from "#/components/page-header";
import { useQueryParam } from "#/components/use-router";
import React, { useEffect, useMemo, useState } from "react";
import { restAddToCollection, restRemoveFromCollection } from "#/store/api";
import { collectionCompare, collectionFullName } from "#/utils/utils";
import { getCollectionStore, getSongStore, onCollectionStoreChange, onSongStoreChange } from "#/worker/client";
import type { CollectionRecord, ListedCollection, ListedSong } from "#/worker/types";

function useListedCollections(): ListedCollection[] {
  const [list, setList] = useState<ListedCollection[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () =>
      getCollectionStore()
        .getCollectionList()
        .then(v => {
          if (alive) setList(v.collections);
        });
    load();
    const off = onCollectionStoreChange(load);
    return () => {
      alive = false;
      off();
    };
  }, []);
  return list;
}

function useCollectionBySlug(slug: string | null): CollectionRecord | null {
  const [record, setRecord] = useState<CollectionRecord | null>(null);
  useEffect(() => {
    if (!slug) {
      setRecord(null);
      return undefined;
    }
    let alive = true;
    const load = () =>
      getCollectionStore()
        .getCollection({ slug })
        .then(v => {
          if (alive) setRecord(v);
        });
    load();
    const off = onCollectionStoreChange(load);
    return () => {
      alive = false;
      off();
    };
  }, [slug]);
  return record;
}

function useListedSongs(): ListedSong[] {
  const [songs, setSongs] = useState<ListedSong[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () =>
      getSongStore()
        .getSongList()
        .then(v => {
          if (alive) setSongs(v.songs);
        });
    load();
    const off = onSongStoreChange(load);
    return () => {
      alive = false;
      off();
    };
  }, []);
  return songs;
}

export default function CollectionDiff() {
  const unsortedList = useListedCollections();
  const sortedList = useMemo(
    () => [...unsortedList].sort((a, b) => collectionCompare({ item: a }, { item: b })),
    [unsortedList],
  );
  const [a, setA] = useQueryParam("a");
  const [b, setB] = useQueryParam("b");
  const [ban, setBan] = useQueryParam("ban");
  return (
    <div className="px-2">
      <PageHeader>Diff</PageHeader>
      <div style={{ display: "flex", gap: 16 }}>
        <label>
          Old:{" "}
          <select
            value={a ?? ""}
            onChange={evt => {
              setA(evt.currentTarget.value);
            }}
          >
            <option disabled value="">
              Choose collection
            </option>
            {sortedList.map(item => (
              <option key={item.id} value={item.slug}>
                {collectionFullName(item)}
              </option>
            ))}
          </select>
        </label>
        <label>
          New:{" "}
          <select
            value={b ?? ""}
            onChange={evt => {
              setB(evt.currentTarget.value);
            }}
          >
            <option disabled value="">
              Choose collection
            </option>
            {sortedList.map(item => (
              <option key={item.id} value={item.slug}>
                {collectionFullName(item)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ban:{" "}
          <select
            value={ban ?? ""}
            onChange={evt => {
              setBan(evt.currentTarget.value);
            }}
          >
            <option value="">None</option>
            {sortedList.map(item => (
              <option key={item.id} value={item.slug}>
                {collectionFullName(item)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {a && b ? <ActualDiff a={a} b={b} ban={ban} /> : null}
    </div>
  );
}

function ActualDiff({ a: aSlug, b: bSlug, ban: banSlug }: { a: string; b: string; ban: string | null }) {
  const a = useCollectionBySlug(aSlug);
  const ban = useCollectionBySlug(banSlug);
  const b = useCollectionBySlug(bSlug);
  const unsortedSongs = useListedSongs();

  const songs = useMemo(() => [...unsortedSongs].sort(compareSongs), [unsortedSongs]);

  function refresh() {
    getCollectionStore().triggerRefetch();
  }

  const sets = useMemo(() => {
    if (!a || !b) return null;

    const aSet = new Set(a.data.songIds);
    const bSet = new Set(b.data.songIds);
    const banSet = new Set(ban?.data.songIds ?? []);

    const added = new Set<string>();
    const removed = new Set<string>();
    const kept = new Set<string>();
    const neither = new Set<string>();
    const bad = new Set<string>();

    for (const { id } of songs) {
      const inA = aSet.has(id);
      const inB = bSet.has(id);
      if (banSet.has(id)) {
        if (inB) bad.add(id);
        else if (inA) removed.add(id);
      } else if (inA) {
        if (inB) kept.add(id);
        else removed.add(id);
      } else {
        if (inB) added.add(id);
        else neither.add(id);
      }
    }

    return { added, removed, kept, neither, b: bSet, a: aSet, bad };
  }, [a, b, ban, songs]);

  if (!sets) return null;
  return (
    <>
      <div style={{ marginTop: 16 }}>
        <div>Songs in old: {sets.a.size}</div>
        <div>Songs in new: {sets.b.size}</div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <form
          onSubmit={event => {
            event.preventDefault();
            const id = getSongId(event);
            if (!id) return;
            console.log(id, bSlug);
            removeFromCollection(id, bSlug).then(refresh);
          }}
        >
          <SongList songs={songs} set={sets.kept} title="Kept" actionTitle="X" />
        </form>
        <form
          onSubmit={event => {
            event.preventDefault();
            const id = getSongId(event);
            if (!id) return;
            removeFromCollection(id, bSlug).then(refresh);
          }}
        >
          <SongList songs={songs} set={sets.added} title="Added" actionTitle="X" />
        </form>

        <form
          onSubmit={event => {
            event.preventDefault();
            const id = getSongId(event);
            if (!id) return;
            addToCollection(id, bSlug).then(refresh);
          }}
        >
          <SongList songs={songs} set={sets.removed} title="Removed" actionTitle="+" />{" "}
        </form>
        {sets.bad.size > 0 ? (
          <form
            onSubmit={event => {
              event.preventDefault();
              const id = getSongId(event);
              if (!id) return;
              removeFromCollection(id, bSlug).then(refresh);
            }}
          >
            <SongList songs={songs} set={sets.bad} title="Banned but present" actionTitle="X" />
          </form>
        ) : null}

        <form
          onSubmit={event => {
            event.preventDefault();
            const id = getSongId(event);
            if (!id) return;
            addToCollection(id, bSlug).then(refresh);
          }}
        >
          <SongList songs={songs} set={sets.neither} title="In neither" actionTitle="+" />
        </form>
      </div>
    </>
  );
}

function getSongId(event: React.FormEvent<HTMLFormElement>) {
  return ((event.nativeEvent as any).submitter as HTMLElement).dataset["song"];
}

function SongList({
  songs,
  set,
  title,
  actionTitle,
}: {
  songs: readonly ListedSong[];
  set: Set<string>;
  title: string;
  actionTitle: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <h2>{title}</h2>
      {songs.map(song =>
        set.has(song.id) ? (
          <div key={song.id}>
            <input type="submit" name="song" data-song={song.id} value={actionTitle} />
            {!song.author || !song.title ? song.author || song.title : `${song.title} - ${song.author}`}
          </div>
        ) : null,
      )}
    </div>
  );
}

function addToCollection(song: string, collection: string) {
  return restAddToCollection(collection, song);
}

function removeFromCollection(song: string, collection: string) {
  return restRemoveFromCollection(collection, song);
}

function compareSongs(a: ListedSong, b: ListedSong) {
  const ret = a.title.localeCompare(b.title);
  if (ret !== 0) return ret;
  return a.author.localeCompare(b.author);
}

export { CollectionDiff as Component };
