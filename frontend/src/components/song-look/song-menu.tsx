import { EllipsisVerticalIcon, ShuffleIcon, XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { useGetRandomSong } from "#/sections/song-list/worker-list";
import type { SongType } from "#/store/store-song";

function MenuButton({
  className = "",
  ...props
}: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={
        "flex size-12 items-center justify-center rounded-full border border-black/10 bg-white text-xl font-medium shadow-lg transition-colors hover:bg-black/5 active:bg-black/10 dark:border-white/15 dark:bg-neutral-900 dark:hover:bg-white/10 dark:active:bg-white/15 " +
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
  useEffect(() => {
    if (transposition >= 12) setTransposition(transposition - 12);
    else if (transposition <= -12) setTransposition(transposition + 12);
  });
  const navigate = useNavigate();
  const location = useLocation();
  const getRandomSong = useGetRandomSong();

  return (
    <div className="fixed bottom-0 right-0 z-10 flex flex-col items-end gap-2 p-3">
      {open ? (
        <>
          <div className="flex items-center gap-2">
            {transposition ? (
              <span className="rounded-full bg-black/80 px-2.5 py-1 text-sm font-medium tabular-nums text-white dark:bg-white/85 dark:text-black">
                {transposition > 0 ? "+" : ""}
                {transposition}
              </span>
            ) : null}
            <MenuButton aria-label={t("song-menu.Transpose up")} onClick={() => setTransposition(transposition + 1)}>
              +1
            </MenuButton>
          </div>
          <MenuButton aria-label={t("song-menu.Transpose down")} onClick={() => setTransposition(transposition - 1)}>
            -1
          </MenuButton>
          <MenuButton
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
          </MenuButton>
        </>
      ) : null}
      <MenuButton
        aria-label={t("info.More actions")}
        aria-expanded={open}
        className={open ? "bg-black/5 dark:bg-white/10" : ""}
        onClick={() => setOpen(o => !o)}
      >
        {open ? <XIcon size={24} /> : <EllipsisVerticalIcon size={24} />}
      </MenuButton>
    </div>
  );
}
