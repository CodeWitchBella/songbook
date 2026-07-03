import { ErrorPage, NotFound } from "#/components/error-page";
import { LargeInput } from "#/components/input";
import { BasicButton } from "#/components/interactive/basic-button";
import { ListButton } from "#/components/interactive/list-button";
import { PrimaryButton } from "#/components/interactive/primary-button";
import { useLogin } from "#/components/use-login";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useParams } from "react-router";
import { useNewSong } from "#/store/store";
import type { IntermediateSongData } from "#/utils/song-from-link";
import { convertToSong, songDataFromLink } from "#/utils/song-from-link";

const types: { [type: string]: JSX.Element } = {
  link: <CreateSongLink />,
  manual: <CreateSongManual />,
  switch: <></>,
};

export default function CreateSong() {
  const params = useParams<{ type?: string }>();
  const { t } = useTranslation();
  const type = params.type ?? "switch";
  const login = useLogin();
  if (!login.viewer) {
    return (
      <ErrorPage text={t("You have to be logged in to add a song")}>
        <div className="mb-1 mt-2 flex flex-row">
          <ListButton to="/login">{t("Log in")}</ListButton>
          <div className="w-4" />
          <ListButton to="/register">{t("Register")}</ListButton>
        </div>
      </ErrorPage>
    );
  }
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center">
      <CreateSongSwitch />
      {types[type] || <NotFound />}
    </div>
  );
}

function SwitchButton({ type, children }: { type: string; children: string }) {
  const params = useParams<{ type?: string }>();
  const activeType = params.type ?? "switch";
  return (
    <BasicButton
      className={"m-2 border border-solid px-4 py-2 text-base" + (activeType === type ? " font-bold" : "")}
      to={"/new/" + type}
      replace={true}
    >
      {children}
    </BasicButton>
  );
}

function CreateSongSwitch() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-row">
      <SwitchButton type="link">{t("create.Using link")}</SwitchButton>
      <SwitchButton type="manual">{t("create.Manually")}</SwitchButton>
    </div>
  );
}

function useSubmit(submitter: () => Promise<string | false>) {
  const [disabled, setDisabled] = useState(false);

  const submit = (evt: { preventDefault(): void }) => {
    evt.preventDefault();
    if (disabled) return;

    setDisabled(true);

    submitter()
      .then(slug => {
        console.log("result", slug);
        if (slug) {
          window.location.pathname = `/edit/${slug}`;
        } else {
          setDisabled(false);
        }
      })
      .catch(e => {
        setDisabled(false);
        console.error(e);
      });
  };
  return { submit, disabled };
}

function getURLFromSearch(search: string) {
  function parse(input: string | undefined | null) {
    try {
      if (!input) return "";
      const match = /https?:[^ \n\t]+/.exec(input);
      if (!match) return "";
      const url = new URL(match[0], "file:///");
      return url.protocol === "http:" || url.protocol === "https:" ? match[0] : "";
    } catch {
      return "";
    }
  }

  const params = new URLSearchParams(search);
  return parse(params.get("url")) || parse(params.get("text")) || parse(params.get("title")) || "";
}

function CreateSongLink() {
  const location = useLocation();
  const [link, setLink] = useState(getURLFromSearch(location.search));
  const [error, setError] = useState("");

  const { t } = useTranslation();
  const [downloadedSong, setDownloadedSong] = useState<IntermediateSongData | null>(null);
  const form = useSubmit(async () => {
    setError("");
    const song = await songDataFromLink(link, t);
    if (typeof song === "string") {
      setError(song);
      return false;
    }
    setDownloadedSong(song);
    return false;
  });

  return (
    <div className="mt-12 flex max-w-full justify-center">
      {downloadedSong ? (
        <SubmitSong cancel={() => setDownloadedSong(null)} songData={downloadedSong} />
      ) : (
        <form className="flex w-full max-w-prose flex-col gap-2 p-2 text-lg" onSubmit={form.submit}>
          <LargeInput label={t("create.Link")} value={link} onChange={setLink} />
          <div className="h-2" />
          <PrimaryButton disabled={form.disabled} onPress={form.submit}>
            {t("create.Download")}
          </PrimaryButton>
          <button disabled={form.disabled} className="hidden" />
          <span className="py-4 text-base text-red-600">{error}</span>
        </form>
      )}
    </div>
  );
}

function SubmitSong({ songData, cancel }: { songData: IntermediateSongData; cancel: () => void }) {
  const { t } = useTranslation();
  const [error, setError] = useState("");
  const song = useMemo(() => convertToSong(songData), [songData]);
  const newSong = useNewSong();

  const form = useSubmit(async () => {
    setError("");
    return newSong(song).then(
      ({ slug }) => slug,
      () => {
        setError(t("create.Failed to save the song"));
        return false;
      },
    );
  });

  return (
    <form className="flex w-full max-w-prose flex-col gap-2 p-2 text-lg text-black dark:text-white" onSubmit={form.submit}>
      <span className="py-4 text-base text-red-600">{error}</span>
      <span className="text-base">
        <span className="font-bold">{t("create.Song name")}:</span> {song.title}
      </span>
      <span className="text-base">
        <span className="font-bold">{t("create.Link")}:</span> {songData.link}
      </span>
      <span className="text-base">
        <span className="font-bold">{t("create.Song author")}:</span> {song.author}
      </span>
      <span className="text-base">
        <span className="font-bold">{t("create.Text")}:</span>{" "}
      </span>
      <span className="text-base">{song.text}</span>
      <button disabled={form.disabled} className="hidden" />
      <div className="flex flex-row justify-end">
        <PrimaryButton onPress={cancel} disabled={form.disabled}>
          {t("create.Cancel")}
        </PrimaryButton>
        <PrimaryButton disabled={form.disabled} onPress={form.submit} style={{ marginLeft: 8 }}>
          {t("create.Confirm")}
        </PrimaryButton>
      </div>
    </form>
  );
}

function CreateSongManual() {
  const newSong = useNewSong();
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const { submit, disabled } = useSubmit(() =>
    newSong({
      author,
      title,
    }).then(({ slug }) => slug),
  );
  const { t } = useTranslation();

  return (
    <div className="mt-12 flex max-w-full justify-center">
      <form className="flex w-full max-w-prose flex-col gap-2 p-2 text-lg" onSubmit={submit}>
        <LargeInput label={t("create.Song author")} value={author} onChange={setAuthor} />
        <LargeInput label={t("create.Song name")} value={title} onChange={setTitle} />
        <div className="h-2" />
        <PrimaryButton disabled={disabled} onPress={submit}>
          {t("create.Create")}
        </PrimaryButton>
        <button className="hidden" />
      </form>
    </div>
  );
}
