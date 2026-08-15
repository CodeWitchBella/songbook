import { BackButton } from "#/components/back-button";
import { ListButton } from "#/components/interactive/list-button";
import { DownloadPDF } from "#/components/pdf";
import { SearchTextInput } from "#/components/search-text-input";
import TopMenu from "#/components/top-menu";
import { useQueryParam, useQueryParamQ } from "#/components/use-router";
import { ArrowLeftIcon } from "lucide-react";
import { useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRevalidator } from "react-router";
import { SongListLook } from "#/sections/song-list/song-list-look";
import { buildList, compareListed } from "#/sections/song-list/worker-list";
import type { SongType } from "#/store/store-song";
import { getSongStore, useSongStoreChange } from "#/worker/client";
import type { ListedSong, SearchResult, SongListStats } from "#/worker/types";
import { clear } from "localforage";

type LoaderData = {
  songs: ListedSong[];
  stats: SongListStats;
  results: SearchResult | null;
};

export async function loader({ request }: LoaderFunctionArgs): Promise<LoaderData> {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const store = getSongStore();
  const [{ songs, stats }, results] = await Promise.all([
    store.getSongList(),
    q ? store.searchSongs(q) : Promise.resolve(null),
  ]);
  return { songs, stats, results };
}

export function Component() {
  const { t } = useTranslation();
  const { songs, results } = useLoaderData() as LoaderData;
  const revalidator = useRevalidator();
  const revalidate = useCallback(() => revalidator.revalidate(), [revalidator]);
  useSongStoreChange(revalidate);

  const [sortByAuthorSrc, setSortByAuthor] = useQueryParam("sortByAuthor");
  const sortByAuthor = sortByAuthorSrc === "yes";

  const byId = useMemo(() => new Map(songs.map(s => [s.id, s])), [songs]);
  const sorted = useMemo(() => [...songs].sort(compareListed(sortByAuthor)), [songs, sortByAuthor]);
  const list = useMemo(
    () =>
      buildList(
        byId,
        results,
        sorted.map(s => s.id),
        sortByAuthor,
      ),
    [byId, results, sorted, sortByAuthor],
  );

  const [optimisticQ, onChangeSearch] = useQueryParamQ();

  // PDF over the listed songs; the shared worker keeps song text out of the tab,
  // so the whole-songbook PDF is degraded (no text) until it gets its own path.
  const pdfList = sorted as unknown as SongType[];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b">
        <div className="relative mx-auto max-w-md" style={{ width: "calc(100% - 22px)" }}>
          <div className="relative my-2 flex items-stretch px-1">
            <BackButton className="py-2 pr-2">
              <ArrowLeftIcon size={24} />
            </BackButton>
            <SearchTextInput value={optimisticQ ?? ""} onChange={onChangeSearch} />
            <TopMenu>
              <ListButton onPress={() => setSortByAuthor(sortByAuthor ? null : "yes")} style={{ textAlign: "left" }}>
                {sortByAuthor ? t("Sort by name") : t("Sort by interpret")}
              </ListButton>
              <div className="h-2" />
              <DownloadPDF list={pdfList} slug={null} title="Zpěvník">
                {(text, onClick) => (
                  <ListButton onPress={onClick} style={{ textAlign: "left" }}>
                    {text}
                  </ListButton>
                )}
              </DownloadPDF>
            </TopMenu>
          </div>
        </div>
      </div>
      <div className="min-h-0 grow">
        <SongListLook list={list} />
      </div>
    </div>
  );
}
