import { DumbModal } from "#/components/dumb-modal";
import { useLanguage } from "#/components/localisation";
import { EllipsisVerticalIcon, PencilLineIcon, PlayIcon, ShuffleIcon, XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";
import { useGetRandomSong } from "#/sections/song-list/worker-list";
import type { SongType } from "#/store/store-song";
import { formatDate } from "#/utils/format-date";

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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-black/60 dark:text-white/60">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </>
  );
}

export function SongInfoModal({ close, song }: { close: () => void; song: SongType }) {
  const { t } = useTranslation();
  const [lng] = useLanguage();
  const unknownEditor = t("info.editor-unknown");
  const unknownDate = t("info.inserted-before-2019-05-20");
  const service = song.spotify ? serviceName(song.spotify) : null;
  return (
    <DumbModal close={close} hint={t("Click on the backdrop to close this")}>
      <div className="max-w-[min(30rem,calc(100vw-3.5rem))] text-black dark:text-white">
        <div className="mb-4 border-b border-black/10 pb-3 dark:border-white/15">
          <div className="text-xl font-bold leading-tight">{song.title}</div>
          {song.author ? <div className="text-base text-black/60 dark:text-white/60">{song.author}</div> : null}
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-base">
          <InfoRow label={t("info.Inserted by")} value={song.editor?.name || unknownEditor} />
          <InfoRow
            label={t("info.Inserted")}
            value={song.insertedAt ? formatDate(lng, t, song.insertedAt.toISO()) : unknownDate}
          />
          <InfoRow label={t("info.Last edit")} value={formatDate(lng, t, song.lastModified.toISO())} />
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to={`/edit/${song.slug}`}
            state={{ canGoBack: true }}
            className="flex min-w-max flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-black/15 px-3 py-2 text-base font-medium dark:border-white/20"
          >
            <PencilLineIcon size={20} />
            {t("info.Edit song")}
          </Link>
          {song.spotify ? (
            <a
              href={song.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-max flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-black/15 px-3 py-2 text-base font-medium dark:border-white/20"
            >
              <PlayIcon size={20} />
              {service ? t("info.Play on {{service}}", { service }) : t("info.Play")}
            </a>
          ) : null}
        </div>
      </div>
    </DumbModal>
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
