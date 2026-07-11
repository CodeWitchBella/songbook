import { ChordHelp } from "#/components/chord-help";
import SongMenu from "#/components/song-look/song-menu";
import { WasmSongLook } from "#/components/song-look/wasm-song-look";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import type { SongType } from "#/store/store-song";

function queryJoin(path: string, query: string) {
  if (!query || query.startsWith("?")) return path + query;
  return path + "?" + query;
}

export default function SongSection({
  song,
  enableMenu = false,
  embed: _ = false,
}: {
  song: SongType;
  enableMenu?: boolean;
  embed?: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [chordHelp, setChordHelp] = useState("");

  const query = new URLSearchParams(location.search);
  const tr = query.get("transposition");
  const transposition = Number.parseInt(`${(Array.isArray(tr) ? tr[0] : tr) || 0}`, 10);

  return (
    <React.Fragment>
      <div className="flex flex-wrap justify-center">
        <WasmSongLook song={song} transposition={transposition} onChordPress={setChordHelp} />
      </div>
      {enableMenu && (
        <SongMenu
          song={song}
          transposition={transposition}
          setTransposition={v =>
            navigate(queryJoin(location.pathname, setTransposition(query, v)), {
              replace: true,
            })
          }
        />
      )}
      {chordHelp ? <ChordHelp chord={chordHelp} close={() => setChordHelp("")} /> : null}
    </React.Fragment>
  );
}

function setTransposition(query: URLSearchParams, value: number) {
  const res = new URLSearchParams(query);
  if (value) res.set("transposition", value + "");
  else res.delete("transposition");
  return res.toString();
}
