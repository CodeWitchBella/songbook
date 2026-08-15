import { DumbModal } from "#/components/dumb-modal";
import {
  FONT_SIZE_LIMITS,
  fontSizesOf,
  useFontSizeSettings,
  type RepeatedChordsSetting,
} from "#/components/font-size-settings";
import { extractFrontmatter } from "#/wasm/grammar/song-parse";
import type { SongType } from "#/store/store-song";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function FontSizeModal({ close, song }: { close: () => void; song: SongType }) {
  const { t } = useTranslation();
  const [settings, change] = useFontSizeSettings();
  const sample = useMemo(() => firstTextLine(song.text) || t("font-size.sample"), [song.text, t]);
  const sizes = fontSizesOf(settings);

  return (
    <DumbModal close={close} hint={t("Click on the backdrop to close this")} className="w-96 max-w-full px-6 py-5">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <div className="text-lg font-semibold">{t("font-size.Font size")}</div>
          <div className="text-sm opacity-70">{t("font-size.description")}</div>
        </div>

        <RatioSlider
          label={t("font-size.Ideal size")}
          hint={t("font-size.ideal hint")}
          limits={FONT_SIZE_LIMITS.ideal}
          value={settings.idealRatio}
          preview={sizes.ideal}
          sample={sample}
          onChange={idealRatio => change({ idealRatio })}
        />

        <RatioSlider
          label={t("font-size.Minimal size")}
          hint={t("font-size.minimal hint")}
          limits={FONT_SIZE_LIMITS.minimal}
          value={settings.minimalRatio}
          preview={sizes.minimal}
          sample={sample}
          onChange={minimalRatio => change({ minimalRatio })}
        />

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t("font-size.Repeated chords")}</span>
          <span className="text-xs opacity-70">{t("font-size.repeated hint")}</span>
          <div className="mt-1 flex flex-col gap-2">
            {REPEATED_CHORDS_OPTIONS.map(option => (
              <RepeatedChordsButton
                key={option}
                active={settings.repeatedChords === option}
                onClick={() => change({ repeatedChords: option })}
                label={t(`font-size.repeated.${option}`)}
                hint={t(`font-size.repeated.${option} hint`)}
              />
            ))}
          </div>
        </div>
      </div>
    </DumbModal>
  );
}

const REPEATED_CHORDS_OPTIONS: RepeatedChordsSetting[] = ["keep", "when-needed", "always-hide"];

function RepeatedChordsButton({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-left ${
        active
          ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
          : "border-neutral-300 dark:border-neutral-600"
      }`}
    >
      <span className="block text-sm font-medium">{label}</span>
      <span className="block text-xs opacity-70">{hint}</span>
    </button>
  );
}

function RatioSlider({
  label,
  hint,
  limits,
  value,
  preview,
  onChange,
  sample,
}: {
  label: string;
  hint: string;
  limits: { min: number; max: number; step: number };
  value: number;
  /** the size this ratio works out to, in px, shown in the preview */
  preview: number;
  onChange: (v: number) => void;
  sample: string;
}) {
  const { t } = useTranslation();
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-medium tabular-nums">{Math.round(value * 100)} %</span>
      </span>
      <span className="text-xs opacity-70">{hint}</span>
      <input
        type="range"
        className="mt-1 w-full accent-black dark:accent-white"
        min={limits.min}
        max={limits.max}
        step={limits.step}
        value={value}
        onChange={event => onChange(event.currentTarget.valueAsNumber)}
      />
      <span className="mt-1 text-xs tracking-wide uppercase opacity-60">{t("font-size.Preview")}</span>
      <span
        // shows what the size actually looks like, in the font songs are rendered in
        className="overflow-hidden text-ellipsis whitespace-nowrap"
        // Cantarell is LYRIC_FONT_FAMILY in songbook-layout — the face the renderer sets lyrics in
        style={{ fontSize: preview, fontFamily: "Cantarell", lineHeight: 1.2 }}
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
