import { animated, useTransition } from "@react-spring/web";
import {
  ALargeSmallIcon,
  CombineIcon,
  EllipsisVerticalIcon,
  PencilLineIcon,
  PlayIcon,
  SettingsIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { useLanguage } from "#/components/localisation";
import { useViewer } from "#/store/store";
import type { SongType } from "#/store/store-song";
import { formatDate } from "#/utils/format-date";
import { FontSizeModal } from "./font-size-modal";

// the field is called "spotify" for historical reasons, but it can point anywhere
const knownServices: readonly (readonly [RegExp, string])[] = [
  [/(^|\.)spotify\.com$/, "Spotify"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "YouTube"],
  [/(^|\.)youtube-nocookie\.com$/, "YouTube"],
  [/(^|\.)soundcloud\.com$/, "SoundCloud"],
  [/(^|\.)bandcamp\.com$/, "Bandcamp"],
  [/(^|\.)apple\.com$/, "Apple Music"],
  [/(^|\.)deezer\.com$/, "Deezer"],
  [/(^|\.)bandzone\.cz$/, "Bandzone"],
  [/(^|\.)supraphonline\.cz$/, "Supraphonline"],
];

export function serviceName(url: string) {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
  for (const [pattern, name] of knownServices) if (pattern.test(host)) return name;
  return host || null;
}

const itemClass =
  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-base font-normal hover:bg-black/5 dark:hover:bg-white/10";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-black/60 dark:text-white/60">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </>
  );
}

export function SongHeaderMenu({ song }: { song: SongType }) {
  const { t } = useTranslation();
  const [lng] = useLanguage();
  const [open, setOpen] = useState(false);
  const [fontSizeOpen, setFontSizeOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const service = song.spotify ? serviceName(song.spotify) : null;
  const unknownEditor = t("info.editor-unknown");
  const unknownDate = t("info.inserted-before-2019-05-20");

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

  const close = () => setOpen(false);
  const [viewer] = useViewer();

  const transitions = useTransition(open, {
    from: { scale: 0.6, y: -8, opacity: 0 },
    enter: { scale: 1, y: 0, opacity: 1 },
    leave: { scale: 0.6, y: -8, opacity: 0 },
    config: { tension: 340, friction: 24, mass: 1 },
  });

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
      {transitions((style, isOpen) =>
        isOpen ? (
          <animated.div
            style={style}
            className="absolute right-0 top-full z-10 mt-1 min-w-64 max-w-[calc(100vw-2rem)] origin-top-right will-change-[transform,opacity] overflow-hidden rounded-xl border border-black/10 bg-white py-1 font-normal shadow-2xl dark:border-white/15 dark:bg-neutral-950"
          >
            {viewer ? (
              <Link to={`/edit/${song.slug}`} state={{ canGoBack: true }} className={itemClass} onClick={close}>
                <PencilLineIcon size={20} />
                {t("info.Edit song")}
              </Link>
            ) : null}
            {song.spotify ? (
              <a href={song.spotify} target="_blank" rel="noopener noreferrer" className={itemClass} onClick={close}>
                <PlayIcon size={20} />
                {service ? t("info.Play on {{service}}", { service }) : t("info.Play")}
              </a>
            ) : null}
            <Link
              to={`/add-to-collection/${song.slug}`}
              state={{ canGoBack: true }}
              className={itemClass}
              onClick={close}
            >
              <CombineIcon size={20} />
              {t("collection.Add to collection")}
            </Link>
            <button
              type="button"
              className={itemClass}
              onClick={() => {
                close();
                setFontSizeOpen(true);
              }}
            >
              <ALargeSmallIcon size={20} />
              {t("font-size.Font size")}
            </button>
            <Link to="/about" state={{ canGoBack: true }} className={itemClass} onClick={close}>
              <SettingsIcon size={20} />
              {t("Settings and about")}
            </Link>
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-black/10 px-4 py-3 text-sm dark:border-white/15">
              <InfoRow label={t("info.Inserted by")} value={song.editor?.name || unknownEditor} />
              <InfoRow
                label={t("info.Inserted")}
                value={song.insertedAt ? formatDate(lng, t, song.insertedAt.toISO()) : unknownDate}
              />
              <InfoRow label={t("info.Last edit")} value={formatDate(lng, t, song.lastModified.toISO())} />
            </dl>
          </animated.div>
        ) : null,
      )}
      {fontSizeOpen ? <FontSizeModal song={song} close={() => setFontSizeOpen(false)} /> : null}
    </div>
  );
}
