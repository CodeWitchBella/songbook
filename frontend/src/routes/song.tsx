import { NotFound } from "components/error-page";
import { useEffect } from "react";
import { useParams } from "react-router";
import { useSearchParams } from "react-router-dom";
import Song from "sections/song/song";

function SongRoute() {
  const { slug } = useParams();
  const [search] = useSearchParams();
  useWakeLock();
  if (!slug) return <NotFound />;
  return (
    <main>
      <Song
        slug={slug}
        enableMenu={!search.has("embed")}
        embed={search.has("embed")}
      />
    </main>
  );
}

function useWakeLock() {
  useEffect(() => {
    if ("wakeLock" in navigator) {
      let wakeLock: Promise<any> | null = (navigator as any).wakeLock.request(
        "screen",
      );
      const handleVisibilityChange = () => {
        if (wakeLock !== null && document.visibilityState === "visible") {
          wakeLock.then((lock) => lock.release());
          wakeLock = (navigator as any).wakeLock.request("screen");
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      document.addEventListener("fullscreenchange", handleVisibilityChange);

      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        document.removeEventListener(
          "fullscreenchange",
          handleVisibilityChange,
        );
        wakeLock?.then((lock) => lock.release());
        wakeLock = null;
      };
    }
    return undefined;
  }, []);
}

export default SongRoute;
