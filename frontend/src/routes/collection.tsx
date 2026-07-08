import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import SongList from "#/sections/song-list/song-list";
import { useCollection, usePagesNum } from "#/store/store";

const emptyArray: never[] = [];
function useColectionWithSet(slug: string) {
  const { collection } = useCollection({ slug });
  const songList = collection ? collection.songList : emptyArray;
  const set = useMemo(() => {
    const v = new Set<string>();
    for (const id of songList) v.add(id);
    return v;
  }, [songList]);
  if (!collection) return null;
  return { set, ...collection };
}

export default function Collection() {
  const params = useParams();
  const slug = params.slug + (params.slug2 ? "/" + params.slug2 : "");
  console.log(slug);
  const collection = useColectionWithSet(slug);
  const set = collection?.set;
  const filter = useCallback((id: string) => set?.has(id) || false, [set]);

  const collectionId = collection?.id;
  useEffect(() => {
    if (collectionId) console.log("Collection id:", collectionId);
  }, [collectionId]);
  if (!collection)
    return <div className="flex h-full items-center justify-center text-xl">Kolekce se načítá nebo neexistuje</div>;
  return (
    <SongList
      filter={filter}
      header={
        <div className="flex flex-col pt-3">
          <span className="text-center text-base font-bold text-black dark:text-white">
            {(collection.slug.includes("/") ? (collection.owner.handle || collection.owner.name) + " > " : "") +
              collection.name}
          </span>
        </div>
      }
      slug={collection.slug}
      title={collection.name}
      menu={<Stats set={set} songCount={collection.songList.length} />}
    />
  );
}

function Stats({ set, songCount }: { set: Set<string> | undefined; songCount: number }) {
  const pagesNum = usePagesNum(set || null);
  const { t } = useTranslation();
  return (
    <div className="mb-1 mt-4 flex flex-row items-center px-5">
      <span className="text-lg text-black dark:text-white">
        {t("count-pages-songs", { pagesNum: pagesNum ?? 0, songCount })}
      </span>
    </div>
  );
}

export { Collection as Component };
