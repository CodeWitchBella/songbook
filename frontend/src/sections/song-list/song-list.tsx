import { BackArrow, BackButton } from "#/components/back-button";
import { ListButton } from "#/components/interactive/list-button";
import { SearchTextInput } from "#/components/search-text-input";
import TopMenu from "#/components/top-menu";
import { useQueryParam } from "#/components/use-router";
import type { PropsWithChildren, ReactNode } from "react";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";

import { collectionSlugToPath } from "#/utils/utils";
import { SongListLook } from "./song-list-look";
import { buildList, compareListed, useWorkerSearch, useWorkerSongList } from "./worker-list";

function SearchContainer({ children }: PropsWithChildren<{}>) {
  return (
    <div className="border-b">
      <div className="relative mx-auto max-w-md" style={{ width: "calc(100% - 22px)" }}>
        {children}
      </div>
    </div>
  );
}

function Search({
  text,
  onChange,
  children,
  topMenu,
}: PropsWithChildren<{
  text: string;
  onChange: (v: string) => void;
  topMenu: ReactNode;
}>) {
  return (
    <SearchContainer>
      {children}
      <div className="relative my-2 flex items-stretch px-1">
        <BackButton className="py-2 pr-2">
          <BackArrow />
        </BackButton>
        <SearchTextInput value={text} onChange={onChange} />
        {topMenu}
      </div>
    </SearchContainer>
  );
}

export default function SongList({
  filter,
  header,
  slug,
  title,
  menu,
}: {
  filter?: (id: string) => boolean;
  header?: ReactNode;
  slug: string | null;
  title: string | null;
  menu?: ReactNode;
}) {
  const { t } = useTranslation();
  const { songs } = useWorkerSongList();
  const [sortByAuthorSrc, setSortByAuthor] = useQueryParam("sortByAuthor");
  const sortByAuthor = sortByAuthorSrc === "yes";

  const [searchSrc, setSearch] = useQueryParam("q");
  const search = searchSrc || "";
  const results = useWorkerSearch(search);

  const byId = useMemo(() => new Map(songs.map(s => [s.id, s])), [songs]);
  const sorted = useMemo(() => [...songs].sort(compareListed(sortByAuthor)), [songs, sortByAuthor]);
  const list = useMemo(
    () =>
      buildList(
        byId,
        results,
        sorted.map(s => s.id),
        sortByAuthor,
        filter,
      ),
    [byId, results, sorted, sortByAuthor, filter],
  );

  const location = useLocation();
  const navigate = useNavigate();
  const clearOnBackRef = useRef((location.state as any)?.clearOnBack);

  return (
    <>
      <Search
        text={search}
        onChange={v => {
          if (clearOnBackRef.current) {
            if (v) {
              setSearch(v, { push: false });
              clearOnBackRef.current = true;
            } else {
              navigate(-1);
              clearOnBackRef.current = false;
            }
          } else {
            if (v) {
              clearOnBackRef.current = true;
              setSearch(v, {
                push: true,
                state: {
                  clearOnBack: true,
                  canGoBack: (location.state as any)?.canGoBack ? 2 : undefined,
                },
              });
            } else {
              clearOnBackRef.current = false;
              setSearch(null);
            }
          }
        }}
        topMenu={
          <TopMenu>
            <ListButton
              onPress={() => {
                setSortByAuthor(sortByAuthor ? null : "yes");
              }}
              style={{ textAlign: "left" }}
            >
              {sortByAuthor ? t("Sort by name") : t("Sort by interpret")}
            </ListButton>
            <Gap />
            {slug !== null && (
              <ListButton to={`/collection/${collectionSlugToPath(slug)}/pdf`} style={{ textAlign: "left" }}>
                {t("pdf-gen.Download PDF")}
              </ListButton>
            )}
            {menu ?? null}
          </TopMenu>
        }
      >
        {header ?? null}
      </Search>
      <div className="min-h-0 grow">
        <SongListLook list={list} />
      </div>
    </>
  );
}

function Gap() {
  return <div className="h-2" />;
}
