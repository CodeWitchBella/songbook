import { CombineIcon, EllipsisVerticalIcon, InfoIcon, PencilLineIcon, PlayIcon, SettingsIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import type { SongType } from "#/store/store-song";
import { serviceName, SongInfoModal } from "./song-menu";

const itemClass =
  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-base font-normal hover:bg-black/5 dark:hover:bg-white/10";

function MenuItem({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className={itemClass} onClick={onClick}>
      {children}
    </button>
  );
}

export function SongHeaderMenu({ song }: { song: SongType }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const service = song.spotify ? serviceName(song.spotify) : null;

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={t("info.More actions")}
        aria-expanded={open}
        className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        onClick={() => setOpen(o => !o)}
      >
        <EllipsisVerticalIcon size={22} />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-10 mt-1 min-w-56 overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-2xl dark:border-white/15 dark:bg-neutral-950">
          <MenuItem
            onClick={() => {
              setOpen(false);
              setInfo(true);
            }}
          >
            <InfoIcon size={20} />
            {t("info.Song info")}
          </MenuItem>
          <Link
            to={`/edit/${song.slug}`}
            state={{ canGoBack: true }}
            className={itemClass}
            onClick={() => setOpen(false)}
          >
            <PencilLineIcon size={20} />
            {t("info.Edit song")}
          </Link>
          {song.spotify ? (
            <a
              href={song.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className={itemClass}
              onClick={() => setOpen(false)}
            >
              <PlayIcon size={20} />
              {service ? t("info.Play on {{service}}", { service }) : t("info.Play")}
            </a>
          ) : null}
          <Link
            to={`/add-to-collection/${song.slug}`}
            state={{ canGoBack: true }}
            className={itemClass}
            onClick={() => setOpen(false)}
          >
            <CombineIcon size={20} />
            {t("collection.Add to collection")}
          </Link>
          <Link to="/quick-settings" state={{ canGoBack: true }} className={itemClass} onClick={() => setOpen(false)}>
            <SettingsIcon size={20} />
            {t("quick-settings.Quick settings")}
          </Link>
        </div>
      ) : null}
      {info ? <SongInfoModal song={song} close={() => setInfo(false)} /> : null}
    </div>
  );
}
