import { BackArrow, BackButton, useGoBack } from "#/components/back-button";
import { ErrorPage } from "#/components/error-page";
import { LargeInput } from "#/components/input";
import { BasicButton } from "#/components/interactive/basic-button";
import { ListButton } from "#/components/interactive/list-button";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import type { WithMethods } from "#/store/generic-store";
import { restAddToCollection, restCreateCollection, restRemoveFromCollection } from "#/store/api";
import { useCollectionList, useSong, useViewer } from "#/store/store";
import type { CollectionType } from "#/store/store-collections";
import { collectionCompare, collectionFullName } from "#/utils/utils";

export default function AddToCollection() {
  const { t } = useTranslation();
  const { refresh, list } = useCollectionList();
  const params = useParams<{ slug: string }>();
  if (!params.slug) throw new Error("Invalid route");
  const { song } = useSong({ slug: params.slug });
  const [viewer] = useViewer();
  const [error, setError] = useState("");
  const goBack = useGoBack();

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!song) {
    return <ErrorPage text={t("Song not found")} />;
  }

  const addable: typeof list = [];
  const removable: typeof list = [];
  const locked: typeof list = [];
  for (const c of list) {
    const isInCollection = c.item.songList.includes(song.id);
    const editable = !c.item.locked && c.item.owner.name === viewer?.name;
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
        <CollectionList list={locked.sort(collectionCompare)} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-2">
      {addable.length > 0 ? <Title first={true} text={t("collection.Add song to collection")} error={error} /> : null}
      <CollectionList
        list={addable.sort(collectionCompare)}
        onPress={collectionId => {
          setError("");
          addToCollection(song.id, collectionId).then(
            () => {
              refresh();
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
        list={removable.sort(collectionCompare)}
        onPress={collectionId => {
          setError("");
          removeFromCollection(song.id, collectionId).then(
            () => {
              refresh();
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
          addToCollection(song.id, collectionId).then(
            () => {
              refresh();
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
      <CollectionList list={locked.sort(collectionCompare)} />
    </div>
  );
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

function CollectionList({
  list,
  onPress,
}: {
  list: readonly WithMethods<CollectionType>[];
  onPress?: (id: string) => void;
}) {
  if (list.length < 1) return null;
  return (
    <>
      {onPress
        ? list.map(item => (
            <ListButton
              key={item.item.id}
              onPress={() => {
                onPress(item.item.id);
              }}
              style={{ marginTop: 8 }}
            >
              <span>{collectionFullName(item.item)}</span>
            </ListButton>
          ))
        : list.map(item => (
            <span key={item.item.id} className="mt-2 text-black dark:text-white">
              {collectionFullName(item.item)}
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
