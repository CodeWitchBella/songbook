import { PageHeader } from "components/page-header";
import { ListButton } from "components/interactive/list-button";
import { TText } from "components/themed";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { graphqlFetch } from "store/graphql";
import { useCollection, useSongList, useViewer } from "store/store";
import type { SongType } from "store/store-song";

export default function CollectionAddSongs() {
  const params = useParams<{ slug: string; slug2?: string }>();
  const slug = params.slug + (params.slug2 ? "/" + params.slug2 : "");
  const { collection, methods } = useCollection({ slug });
  const { songs, initing, loading } = useSongList();
  const [viewer] = useViewer();
  const [pendingSongId, setPendingSongId] = useState<string | null>(null);

  useEffect(() => {
    methods?.refresh();
  }, [methods]);

  const missingSongs = useMemo(() => {
    if (!collection) return [];
    // The picker is derived from the global song list, with songs already in the collection removed.
    const inCollection = new Set(collection.songList);
    return songs
      .map((song) => song.item)
      .filter((song) => !inCollection.has(song.id))
      .sort(compareSongs);
  }, [collection, songs]);

  if (!collection) {
    return (
      <div className="flex h-full items-center justify-center text-xl">
        Collection not found
      </div>
    );
  }

  const editable = !collection.locked && collection.owner.name === viewer?.name;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 pb-4">
      <PageHeader backTo={`/collections/${collection.slug}`}>
        Add songs to {collection.name}
      </PageHeader>
      <div className="text-sm opacity-70">
        {editable
          ? "Tap a song to add it to this collection."
          : "This collection is locked or you do not own it."}
      </div>
      {loading || initing ? (
        <div className="flex h-32 items-center justify-center text-lg">
          Loading songs...
        </div>
      ) : missingSongs.length < 1 ? (
        <TText style={{ fontSize: 18 }}>
          All songs are already in this collection.
        </TText>
      ) : (
        <div className="flex flex-col gap-2">
          {missingSongs.map((song) => (
            <SongRow
              key={song.id}
              song={song}
              canAdd={editable}
              busy={pendingSongId === song.id}
              onAdd={async () => {
                if (!collection || !editable) return;
                // Add to the current collection, then refresh so the song disappears from this list.
                setPendingSongId(song.id);
                try {
                  await addToCollection(song.id, collection.id);
                  methods?.refresh();
                } finally {
                  setPendingSongId(null);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SongRow({
  song,
  canAdd,
  busy,
  onAdd,
}: {
  song: SongType;
  canAdd: boolean;
  busy: boolean;
  onAdd: () => Promise<void>;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2">
      <div className="min-w-0 flex-1">
        {/* Keep the row compact and readable even for long titles. */}
        <div className="truncate text-base font-medium">
          {!song.author || !song.title
            ? song.author || song.title
            : `${song.title} - ${song.author}`}
        </div>
      </div>
      <ListButton
        disabled={!canAdd || busy}
        onPress={() => {
          void onAdd();
        }}
        style={{ minWidth: 120 }}
      >
        {busy ? "Adding..." : canAdd ? "Add" : "Locked"}
      </ListButton>
    </div>
  );
}

function compareSongs(a: SongType, b: SongType) {
  // Sort by title first so the picker stays predictable and easy to scan.
  const ret = a.title.localeCompare(b.title);
  if (ret !== 0) return ret;
  return a.author.localeCompare(b.author);
}

function addToCollection(song: string, collection: string) {
  return graphqlFetch({
    query: `mutation($collection: String! $song: String!) { addToCollection(collection: $collection song: $song) }`,
    variables: { collection, song },
  });
}