import { ChordHelp } from "components/chord-help";
import { useContinuousModeSetting } from "components/continuous-mode";
import { SongLook } from "components/song-look/song-look";
import SongMenu from "components/song-look/song-menu";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSong } from "store/store";
import * as parser from "utils/song-parser/song-parser";

function queryJoin(path: string, query: string) {
  if (!query || query.startsWith("?")) return path + query;
  return path + "?" + query;
}

export default function SongSection({
  slug,
  enableMenu = false,
  embed = false,
}: {
  slug: string;
  enableMenu?: boolean;
  embed?: boolean;
}) {
  const { song } = useSong({ slug });
  const [continuous] = useContinuousModeSetting();
  const parsed = song
    ? parser.parseSong("my", song.text, { continuous })
    : null;

  const location = useLocation();
  const navigate = useNavigate();
  const [chordHelp, setChordHelp] = useState("");

  if (!song || !parsed) return null;

  const query = new URLSearchParams(location.search);
  const tr = query.get("transposition");
  const transposition = Number.parseInt(
    `${(Array.isArray(tr) ? tr[0] : tr) || 0}`,
    10,
  );

  return (
    <React.Fragment>
      <div className="flex flex-wrap justify-center">
        <SongLook
          song={song}
          parsed={parsed}
          transposition={transposition}
          onChordPress={setChordHelp}
          noBack={embed}
        />
      </div>
      {enableMenu && (
        <SongMenu
          song={song}
          transposition={transposition}
          setTransposition={(v) =>
            navigate(queryJoin(location.pathname, setTransposition(query, v)), {
              replace: true,
            })
          }
        />
      )}
      {chordHelp ? (
        <ChordHelp chord={chordHelp} close={() => setChordHelp("")} />
      ) : null}
    </React.Fragment>
  );
}

function setTransposition(query: URLSearchParams, value: number) {
  const res = new URLSearchParams(query);
  if (value) res.set("transposition", value + "");
  else res.delete("transposition");
  return res.toString();
}
