import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRevalidator } from "react-router";
import SongList from "#/sections/song-list/song-list";
import { getCollectionStore, useCollectionStoreChange } from "#/worker/client";
import type { CollectionRecord } from "#/worker/types";

function slugFromParams(params: { slug?: string; slug2?: string }) {
  return params.slug + (params.slug2 ? "/" + params.slug2 : "");
}

type LoaderData = { collection: CollectionRecord | null };

export async function loader({ params }: LoaderFunctionArgs): Promise<LoaderData> {
  const slug = slugFromParams(params);
  const collection = await getCollectionStore().getCollection({ slug });
  console.log(collection);
  return { collection };
}

const emptyArray: never[] = [];
function useCollectionWithSet(record: CollectionRecord | null) {
  const songList = record ? record.data.songIds : emptyArray;
  const set = useMemo(() => {
    const v = new Set<string>();
    for (const song of songList) v.add(song);
    return v;
  }, [songList]);
  if (!record) return null;
  return { set, ...record.data };
}

function CollectionRoute() {
  const { collection: record } = useLoaderData() as LoaderData;
  const revalidator = useRevalidator();
  const revalidate = useCallback(() => revalidator.revalidate(), [revalidator]);
  useCollectionStoreChange(revalidate);

  const collection = useCollectionWithSet(record);
  const set = collection?.set;
  const filter = useCallback((id: string) => set?.has(id) || false, [set]);

  if (!collection)
    return <div className="flex h-full items-center justify-center text-xl">Kolekce se načítá nebo neexistuje</div>;
  return (
    <SongList
      filter={filter}
      header={
        <div className="flex flex-col pt-3">
          <span className="text-center text-base font-bold text-black dark:text-white">
            {(collection.slug.includes("/") ? (collection.owner?.handle || collection.owner?.name) + " > " : "") +
              collection.name}
          </span>
        </div>
      }
      slug={collection.slug}
      title={collection.name}
      menu={<Stats songCount={collection.songIds.length} />}
    />
  );
}

function Stats({ songCount }: { songCount: number }) {
  const { t } = useTranslation();
  return (
    <div className="mb-1 mt-4 flex flex-row items-center px-5">
      <span className="text-lg text-black dark:text-white">{t("count-pages-songs_songs", { count: songCount })}</span>
    </div>
  );
}

export { CollectionRoute as Component };
