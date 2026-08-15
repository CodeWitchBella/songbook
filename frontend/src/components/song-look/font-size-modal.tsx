import { DumbModal } from "#/components/dumb-modal";
import { FONT_SIZE_LIMITS, useFontSizeSettings } from "#/components/font-size-settings";
import { extractFrontmatter } from "#/wasm/grammar/song-parse";
import type { SongType } from "#/store/store-song";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function FontSizeModal({ close, song }: { close: () => void; song: SongType }) {
  const { t } = useTranslation();
  const [settings, change] = useFontSizeSettings();
  const sample = useMemo(() => firstTextLine(song.text) || t("font-size.sample"), [song.text, t]);

  return (
    <DumbModal close={close} hint={t("Click on the backdrop to close this")} className="w-96 max-w-full px-6 py-5">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <div className="text-lg font-semibold">{t("font-size.Font size")}</div>
          <div className="text-sm opacity-70">{t("font-size.description")}</div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-black dark:accent-white"
              checked={settings.allowLineWrap}
              onChange={event => change({ allowLineWrap: event.currentTarget.checked })}
            />
            <span className="font-medium">{t("font-size.Wrap long lines")}</span>
          </label>

          <div className="pl-7">
            <SizeSlider
              label={t("font-size.Wrap below")}
              sample={sample}
              value={settings.wrapBelowFontSize}
              disabled={!settings.allowLineWrap}
              onChange={wrapBelowFontSize => change({ wrapBelowFontSize })}
            />
          </div>
        </div>

        <SizeSlider
          label={t("font-size.Overflow below")}
          sample={sample}
          value={settings.minFontSize}
          onChange={minFontSize => change({ minFontSize })}
        />
      </div>
    </DumbModal>
  );
}

function SizeSlider({
  label,
  value,
  onChange,
  sample,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  sample: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <label className={"flex flex-col gap-1" + (disabled ? " opacity-50" : "")}>
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm">{label}</span>
        <span className="tabular-nums text-sm font-medium">{value} px</span>
      </span>
      <input
        type="range"
        className="w-full accent-black dark:accent-white"
        min={FONT_SIZE_LIMITS.min}
        max={FONT_SIZE_LIMITS.max}
        step={FONT_SIZE_LIMITS.step}
        value={value}
        disabled={disabled}
        onChange={event => onChange(event.currentTarget.valueAsNumber)}
      />
      <span className="mt-1 text-xs uppercase tracking-wide opacity-60">{t("font-size.Preview")}</span>
      <span
        // shows what the threshold actually looks like, in the font songs are rendered in
        className="overflow-hidden text-ellipsis whitespace-nowrap leading-tight"
        // Cantarell is LYRIC_FONT_FAMILY in songbook-layout — the face the renderer sets lyrics in
        style={{ fontSize: value, fontFamily: "Cantarell" }}
      >
        {sample}
      </span>
    </label>
  );
}

/** first singable line of the song, used as the size preview */
function firstTextLine(text: string) {
  const [, body] = extractFrontmatter(text ?? "");
  for (const rawLine of body.split("\n")) {
    const line = rawLine
      .replace(/^\s*[SR][0-9]*:/, "") // verse/chorus label
      .replace(/\[[^\]]*\]/g, "") // chords
      .replace(/\{[^}]*\}/g, "") // directives
      .trim();
    if (line) return line;
  }
  return "";
}
