import { NotFound } from "#/components/error-page";
import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router";
import Song from "#/sections/song/song";

function SongRoute() {
  const { slug } = useParams();
  const [search] = useSearchParams();
  useWakeLock();
  if (!slug) return <NotFound />;
  return (
    <main>
      <Song slug={slug} enableMenu={!search.has("embed")} embed={search.has("embed")} />
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

export default SongRoute;

export { SongRoute as Component };
