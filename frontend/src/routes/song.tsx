import { NotFound } from "#/components/error-page";
import { DateTime } from "luxon";
import { useCallback, useEffect } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useParams, useRevalidator, useSearchParams } from "react-router";
import Song from "#/sections/song/song";
import type { User } from "#/store/api";
import type { SongType } from "#/store/store-song";
import { getSongStore, useSongStoreChange } from "#/worker/client";
import type { SongRecord } from "#/worker/types";

function toSongType(record: SongRecord): SongType {
  const { data } = record;
  return {
    id: record.id,
    lastModified: record.lastModified ? DateTime.fromISO(record.lastModified) : DateTime.now(),
    slug: data.slug,
    author: data.author,
    title: data.title,
    text: data.text ?? "",
    fontSize: data.fontSize ?? 0,
    paragraphSpace: data.paragraphSpace ?? 0,
    titleSpace: data.titleSpace ?? 0,
    spotify: data.spotify,
    pretranspose: data.pretranspose ?? 0,
    extraSearchable: data.extraSearchable,
    extraNonSearchable: data.extraNonSearchable,
    editor: data.editor as unknown as User | null,
    insertedAt: data.insertedAt ? DateTime.fromISO(data.insertedAt) : null,
  };
}

type LoaderData = { song: SongType | null };

export async function loader({ params }: LoaderFunctionArgs): Promise<LoaderData> {
  const slug = params.slug;
  if (!slug) return { song: null };
  const record = await getSongStore().getSong({ slug });
  return { song: record ? toSongType(record) : null };
}

function SongRoute() {
  const { slug } = useParams();
  const [search] = useSearchParams();
  const { song } = useLoaderData() as LoaderData;
  const revalidator = useRevalidator();
  const revalidate = useCallback(() => revalidator.revalidate(), [revalidator]);
  useSongStoreChange(revalidate);
  useWakeLock();
  if (!slug) return <NotFound />;
  if (!song) return <NotFound />;
  return (
    <main>
      <Song song={song} enableMenu={!search.has("embed")} embed={search.has("embed")} />
    </main>
  );
}

function useWakeLock() {
  useEffect(() => {
    if ("wakeLock" in navigator) {
      // wakeLock.request rejects (NotAllowedError) whenever the lock is denied —
      // e.g. a headless/unfocused tab or a blocking permissions policy. Swallow
      // that so it doesn't bubble up as an unhandled rejection; the lock is a
      // nice-to-have, not essential.
      const requestWakeLock = (): Promise<any> => (navigator as any).wakeLock.request("screen").catch(() => null);
      let wakeLock: Promise<any> | null = requestWakeLock();
      const handleVisibilityChange = () => {
        if (wakeLock !== null && document.visibilityState === "visible") {
          wakeLock.then(lock => lock?.release());
          wakeLock = requestWakeLock();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      document.addEventListener("fullscreenchange", handleVisibilityChange);

      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        document.removeEventListener("fullscreenchange", handleVisibilityChange);
        wakeLock?.then(lock => lock?.release());
        wakeLock = null;
      };
    }
    return undefined;
  }, []);
}

export { SongRoute as Component };
