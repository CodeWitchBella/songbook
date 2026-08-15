import { animated, useTransition } from "@react-spring/web";
import { ALargeSmallIcon, EllipsisVerticalIcon, ShuffleIcon, XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { useGetRandomSong } from "#/sections/song-list/worker-list";
import type { SongType } from "#/store/store-song";
import { FontSizeModal } from "./font-size-modal";

const ROW_HEIGHT = 56;

function MenuButton({
  className = "",
  ...props
}: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={
        "flex size-12 items-center justify-center rounded-full border border-black/10 bg-white text-xl font-medium shadow-lg transition-colors hover:bg-neutral-100 active:bg-neutral-200 dark:border-white/15 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:active:bg-neutral-700 " +
        className
      }
      {...props}
    />
  );
}

export default function SongMenu({
  song,
  transposition,
  setTransposition,
}: {
  song: SongType;
  transposition: number;
  setTransposition: (v: number) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [fontSizeOpen, setFontSizeOpen] = useState(false);
  useEffect(() => {
    if (transposition >= 12) setTransposition(transposition - 12);
    else if (transposition <= -12) setTransposition(transposition + 12);
  });
  const navigate = useNavigate();
  const location = useLocation();
  const getRandomSong = useGetRandomSong();

  const entries = [
    <div key="up" className="flex items-center gap-2">
      {transposition ? (
        <span className="rounded-full bg-black/80 px-2.5 py-1 text-sm font-medium tabular-nums text-white dark:bg-white/85 dark:text-black">
          {transposition > 0 ? "+" : ""}
          {transposition}
        </span>
      ) : null}
      <MenuButton aria-label={t("song-menu.Transpose up")} onClick={() => setTransposition(transposition + 1)}>
        +1
      </MenuButton>
    </div>,
    <MenuButton
      key="down"
      aria-label={t("song-menu.Transpose down")}
      onClick={() => setTransposition(transposition - 1)}
    >
      -1
    </MenuButton>,
    <MenuButton key="font-size" aria-label={t("font-size.Font size")} onClick={() => setFontSizeOpen(true)}>
      <ALargeSmallIcon size={24} />
    </MenuButton>,
    <MenuButton
      key="shuffle"
      aria-label={t("info.Random song")}
      onClick={() => {
        getRandomSong(song.id).then(nextSong => {
          if (!nextSong) return;
          const canGoBackRaw = (location.state as any)?.canGoBack;
          let canGoBack = typeof canGoBackRaw === "number" ? canGoBackRaw : canGoBackRaw ? 1 : 0;
          if (!canGoBack) {
            navigate("/all-songs", { replace: true });
            navigate(location.pathname + location.search + location.hash, { state: location.state });
            canGoBack = 1;
          }

          navigate("/song/" + nextSong.slug, {
            state: { canGoBack: canGoBack + 1 },
          });
        });
      }}
    >
      <ShuffleIcon size={24} />
    </MenuButton>,
  ];

  const parked = (entry: (typeof entries)[number]) => {
    const index = entries.findIndex(candidate => candidate.key === entry.key);
    return { y: (entries.length - index) * ROW_HEIGHT, scale: 0.4, opacity: 0 };
  };

  const transitions = useTransition(open ? entries : [], {
    keys: entry => entry.key!,
    from: parked,
    enter: { y: 0, scale: 1, opacity: 1 },
    leave: parked,
    config: { tension: 320, friction: 20, mass: 1 },
    trail: 35,
  });

  return (
    <div className="fixed bottom-0 right-0 z-10 flex flex-col items-end gap-2 p-3">
      {transitions((style, entry) => (
        <animated.div style={style} className="origin-bottom-right will-change-[transform,opacity]">
          {entry}
        </animated.div>
      ))}
      <MenuButton
        aria-label={t("info.More actions")}
        aria-expanded={open}
        className={"relative " + (open ? "bg-neutral-100 dark:bg-neutral-800" : "")}
        onClick={() => setOpen(o => !o)}
      >
        {open ? <XIcon size={24} /> : <EllipsisVerticalIcon size={24} />}
      </MenuButton>
      {fontSizeOpen ? <FontSizeModal song={song} close={() => setFontSizeOpen(false)} /> : null}
    </div>
  );
}
