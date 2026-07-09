import { getChordDefinition } from "#/components/chord-help";
import { PageHeader } from "#/components/page-header";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import * as parser from "#/utils/song-parser/song-parser";
import { getSongStore, onSongStoreChange } from "#/worker/client";
import type { SongRecord } from "#/worker/types";

/** Full song bodies for every song, refetched whenever the store changes. */
function useAllSongRecords(): SongRecord[] {
  const [records, setRecords] = useState<SongRecord[]>([]);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const store = getSongStore();
      const { songs } = await store.getSongList();
      const fetched = await Promise.all(songs.map(s => store.getSong({ id: s.id })));
      if (alive) setRecords(fetched.filter((r): r is SongRecord => r !== null));
    };
    load();
    const off = onSongStoreChange(load);
    return () => {
      alive = false;
      off();
    };
  }, []);
  return records;
}

const ignore = new Set(["|", "", "kapo", "repeat", "play", "|:", ":|", "...", "(brnk)"]);
export default function Chords() {
  const songs = useAllSongRecords();
  const unknownChords = useMemo(() => {
    const ret = new Map<string, Set<string>>();
    for (const s of songs) {
      const text = s.data.text ?? "";
      const parsed = parser
        .parseSong("my", text, { continuous: "always" })
        .pages.concat(parser.parseSong("my", text, { continuous: "never" }).pages);
      for (const page of parsed) {
        for (const paragraph of page) {
          for (const line of paragraph) {
            for (const part of line.content) {
              if (part.ch) {
                for (const chord of part.ch.replace(/^_/, "").split(" ")) {
                  const ch = chord.replace(/,$/, "").trim();
                  if (!getChordDefinition(ch).def && !ignore.has(ch) && !/^[0-9]/.test(ch) && !/^\(?x[0-9]/.test(ch)) {
                    if (!ret.has(ch)) ret.set(ch, new Set());
                    ret.get(ch)!.add(s.data.slug);
                  }
                }
              }
            }
          }
        }
      }
    }
    return Array.from(ret.keys())
      .sort()
      .map(key => ({
        chord: key,
        slugs: Array.from(ret.get(key)?.values() || []),
      }));
  }, [songs]);
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-1 py-2">
      <PageHeader>Unknown chords</PageHeader>
      {unknownChords.map(({ chord, slugs }) => (
        <div key={chord} className="flex flex-row text-black dark:text-white">
          {JSON.stringify(chord)}{" "}
          <div className="flex flex-col">
            {slugs.map(slug => (
              <Link key={slug} state={{ canGoBack: true }} to={"/song/" + slug}>
                {slug}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export { Chords as Component };
