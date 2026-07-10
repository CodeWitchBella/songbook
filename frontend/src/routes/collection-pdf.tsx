import { useTranslation } from "react-i18next";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRevalidator } from "react-router";
import { useCallback } from "react";
import { PageHeader } from "#/components/page-header";
import { ListButton } from "#/components/interactive/list-button";
import { DownloadPDF } from "#/components/pdf";
import { getCollectionStore, getSongStore, useCollectionStoreChange } from "#/worker/client";
import type { CollectionRecord } from "#/worker/types";
import type { SongType } from "#/store/store-song";
import { toSongType } from "#/store/store-song";
import { collectionParamsToSlug } from "#/utils/utils";

type LoaderData = { collection: CollectionRecord | null; songs: SongType[] };

export async function loader({ params }: LoaderFunctionArgs): Promise<LoaderData> {
  const slug = collectionParamsToSlug(params);
  const collection = await getCollectionStore().getCollection({ slug });
  if (!collection) return { collection: null, songs: [] };

  const songStore = getSongStore();
  const records = await Promise.all(collection.data.songIds.map(id => songStore.getSong({ id })));
  const songs = records.filter(record => record !== null).map(toSongType);
  return { collection, songs };
}

function CollectionPDFRoute() {
  const { t } = useTranslation();
  const { collection: record, songs } = useLoaderData() as LoaderData;
  const revalidator = useRevalidator();
  const revalidate = useCallback(() => revalidator.revalidate(), [revalidator]);
  useCollectionStoreChange(revalidate);

  if (!record)
    return <div className="flex h-full items-center justify-center text-xl">Kolekce se načítá nebo neexistuje</div>;

  const { name, slug, songIds, owner } = record.data;
  const songCount = songIds?.length ?? 0;
  const headerText = (slug.includes("/") ? (owner?.handle || owner?.name) + " > " : "") + name;

  return (
    <div className="mx-auto w-full max-w-lg px-1 pb-2">
      <PageHeader>{headerText}</PageHeader>
      <div className="mb-4 px-4">
        <span className="text-lg text-black dark:text-white">{t("count-pages-songs_songs", { count: songCount })}</span>
      </div>
      <div className="flex flex-col px-4">
        <DownloadPDF list={songs} slug={slug} title={name} autoStart wasm>
          {(text, onClick) => <ListButton onPress={onClick}>{text}</ListButton>}
        </DownloadPDF>
      </div>
    </div>
  );
}

export { CollectionPDFRoute as Component };
