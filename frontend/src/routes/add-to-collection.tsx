import { BackArrow, BackButton, useGoBack } from "#/components/back-button";
import { ErrorPage } from "#/components/error-page";
import { LargeInput } from "#/components/input";
import { BasicButton } from "#/components/interactive/basic-button";
import { ListButton } from "#/components/interactive/list-button";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRevalidator } from "react-router";
import { restAddToCollection, restCreateCollection, restRemoveFromCollection } from "#/store/api";
import { useViewer } from "#/store/store";
import { collectionCompare, collectionFullName } from "#/utils/utils";
import { getCollectionStore, getSongStore, useCollectionStoreChange, useSongStoreChange } from "#/worker/client";
import type { CollectionRecord } from "#/worker/types";

type LoaderData = { songId: string | null; collections: CollectionRecord[] };

export async function loader({ params }: LoaderFunctionArgs): Promise<LoaderData> {
  const slug = params.slug;
  if (!slug) return { songId: null, collections: [] };
  const [record, { collections: listed }] = await Promise.all([
    getSongStore().getSong({ slug }),
    getCollectionStore().getCollectionList(),
  ]);
  const collections = await Promise.all(listed.map(c => getCollectionStore().getCollection({ id: c.id })));
  return {
    songId: record?.id ?? null,
    collections: collections.filter((c): c is CollectionRecord => c !== null),
  };
}

export default function AddToCollection() {
  const { t } = useTranslation();
  const { songId, collections } = useLoaderData() as LoaderData;
  const revalidator = useRevalidator();
  const revalidate = useCallback(() => revalidator.revalidate(), [revalidator]);
  useCollectionStoreChange(revalidate);
  useSongStoreChange(revalidate);
  const [viewer] = useViewer();
  const [error, setError] = useState("");
  const goBack = useGoBack();

  if (!songId) {
    return <ErrorPage text={t("Song not found")} />;
  }

  const addable: CollectionRecord[] = [];
  const removable: CollectionRecord[] = [];
  const locked: CollectionRecord[] = [];
  for (const c of collections) {
    const isInCollection = c.data.songIds.includes(songId);
    const editable = !c.data.locked && c.data.owner?.name === viewer?.name;
    if (editable) {
      if (isInCollection) {
        removable.push(c);
      } else {
        addable.push(c);
      }
    } else if (isInCollection) {
      locked.push(c);
    }
  }

  if (!viewer) {
    return (
      <div className="mx-auto max-w-xl">
        <Title text="Pro přidání písně do kolekce musíš mít účet." first={true} />
        <div className="pt-4" />
        <ListButton to="/login">Přihlásit se</ListButton>
        <div className="pt-2" />
        <ListButton to="/register">Vytvořit účet</ListButton>
        {locked.length > 0 ? <Title text="Píseň je v kolekcích" first={false} /> : null}
        <CollectionList list={sortCollections(locked)} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-2">
      {addable.length > 0 ? <Title first={true} text={t("collection.Add song to collection")} error={error} /> : null}
      <CollectionList
        list={sortCollections(addable)}
        onPress={collectionId => {
          setError("");
          addToCollection(songId, collectionId).then(
            () => {
              getCollectionStore().triggerRefetch();
              goBack();
            },
            err => {
              setError("Něco se pokazilo");
              console.error(err);
            },
          );
        }}
      />
      {removable.length > 0 ? (
        <Title first={addable.length < 1} text={t("collection.Remove song from collection")} error={error} />
      ) : null}
      <CollectionList
        list={sortCollections(removable)}
        onPress={collectionId => {
          setError("");
          removeFromCollection(songId, collectionId).then(
            () => {
              getCollectionStore().triggerRefetch();
              goBack();
            },
            err => {
              setError(t("Something went wrong"));
              console.error(err);
            },
          );
        }}
      />
      <Title first={addable.length < 1 && removable.length < 1} text={t("collection.Create new collection")} />
      <NewCollection
        onDone={collectionId => {
          setError("");
          addToCollection(songId, collectionId).then(
            () => {
              getCollectionStore().triggerRefetch();
              goBack();
            },
            err => {
              console.error(err);
              setError(t("Something went wrong"));
            },
          );
        }}
      />
      {locked.length > 0 ? <Title first={false} text={t("collection.Song is also in collections")} /> : null}
      <CollectionList list={sortCollections(locked)} />
    </div>
  );
}

function sortCollections(list: readonly CollectionRecord[]) {
  return [...list].sort((a, b) => collectionCompare({ item: a.data }, { item: b.data }));
}

function Title({ first, text, error }: { first: boolean; text: string; error?: string | null }) {
  return (
    <>
      <div className="mt-8 flex items-center">
        {first ? (
          <BackButton className="px-2 py-4">
            <BackArrow />
          </BackButton>
        ) : null}
        <span className="text-2xl text-black dark:text-white">{text}</span>
      </div>
      {error && first ? <span className="mt-2 text-base text-red-600">{error}</span> : null}
    </>
  );
}

function NewCollection({ onDone }: { onDone: (id: string) => void }) {
  const [name, setName] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = useState("");
  const submit = (event: { preventDefault(): any }) => {
    event.preventDefault();
    if (disabled) return;
    setDisabled(true);
    setError("");
    createCollection(name).then(
      id => {
        setDisabled(false);
        onDone(id);
      },
      err => {
        setDisabled(false);
        console.error(err);
        setError(t("Something went wrong"));
      },
    );
  };
  const { t } = useTranslation();
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <LargeInput label={t("collection.Collection name")} value={name} onChange={setName} />
      <BasicButton
        disabled={disabled}
        className="border border-solid pb-1.5 pl-2 pr-2 pt-2 text-black dark:text-white"
        onPress={submit}
      >
        {t("collection.Create collection and add song to it")}
      </BasicButton>
      {error ? <span className="text-base text-red-600">{error}</span> : null}
      <button className="hidden" disabled={disabled} />
    </form>
  );
}

function CollectionList({ list, onPress }: { list: readonly CollectionRecord[]; onPress?: (id: string) => void }) {
  if (list.length < 1) return null;
  return (
    <>
      {onPress
        ? list.map(item => (
            <ListButton
              key={item.id}
              onPress={() => {
                onPress(item.id);
              }}
              style={{ marginTop: 8 }}
            >
              <span>{collectionFullName(item.data)}</span>
            </ListButton>
          ))
        : list.map(item => (
            <span key={item.id} className="mt-2 text-black dark:text-white">
              {collectionFullName(item.data)}
            </span>
          ))}
    </>
  );
}
function addToCollection(song: string, collection: string) {
  return restAddToCollection(collection, song);
}

function removeFromCollection(song: string, collection: string) {
  return restRemoveFromCollection(collection, song);
}

function createCollection(name: string): Promise<string> {
  return restCreateCollection(name).then(v => {
    const id = v.createCollection.id;
    if (!id) {
      console.log(v);
      throw new Error("Failed to create collection");
    }
    return id;
  });
}

export { AddToCollection as Component };
