import { PageHeader } from "#/components/page-header";
import { DateTime } from "luxon";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLoaderData, useRevalidator } from "react-router";
import { getCollectionStore, useCollectionStoreChange } from "#/worker/client";
import type { ListedCollection } from "#/worker/types";
import { collectionCompare, collectionFullName, collectionSlugToPath } from "#/utils/utils";

let lastRefreshThisRefresh: DateTime | null = null;

type LoaderData = { collections: ListedCollection[] };

export async function loader(): Promise<LoaderData> {
  const { collections } = await getCollectionStore().getCollectionList();
  return { collections };
}

export default function CollectionList() {
  const { t } = useTranslation();
  const { collections: unsortedList } = useLoaderData() as LoaderData;
  const revalidator = useRevalidator();
  const revalidate = useCallback(() => revalidator.revalidate(), [revalidator]);
  useCollectionStoreChange(revalidate);

  useEffect(() => {
    if (!lastRefreshThisRefresh || lastRefreshThisRefresh.plus({ hours: 1 }) < DateTime.utc()) {
      lastRefreshThisRefresh = DateTime.utc();
      getCollectionStore().triggerRefetch();
    }
  }, []);
  const sortedList = useMemo(
    () => [...unsortedList].sort((a, b) => collectionCompare({ item: a }, { item: b })),
    [unsortedList],
  );
  return (
    <div className="mx-auto flex w-full max-w-max flex-col gap-4 px-4 pb-4">
      <PageHeader>{t("Collections")}</PageHeader>
      <Link state={{ canGoBack: true }} to="/all-songs" className="hover:underline">
        {t("All songs")}
      </Link>
      {sortedList.map(collection => (
        <Link
          state={{ canGoBack: true }}
          key={collection.id}
          to={`/collection/${collectionSlugToPath(collection.slug)}`}
          className="hover:underline"
        >
          {collectionFullName(collection)}
        </Link>
      ))}
    </div>
  );
}

export { CollectionList as Component };
