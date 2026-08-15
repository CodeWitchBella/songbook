import { useCallback, useEffect, useMemo, useState } from "react";

const key = "font-size-settings";

export type FontSizeSettings = {
  /** the size songs are set at when they fit, as a ratio of the root font size */
  idealRatio: number;
  /** how far a song may be shrunk to fit, as a ratio of the ideal size */
  minimalRatio: number;
};

export const FONT_SIZE_LIMITS = {
  ideal: { min: 0.5, max: 2, step: 0.05 },
  minimal: { min: 0.3, max: 1, step: 0.05 },
} as const;

export const defaultFontSizeSettings: FontSizeSettings = {
  idealRatio: 1,
  minimalRatio: 0.85,
};

function clampRatio(value: unknown, limits: { min: number; max: number }, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(limits.max, Math.max(limits.min, value));
}

function normalize(parsed: any): FontSizeSettings {
  if (!parsed || typeof parsed !== "object") return defaultFontSizeSettings;
  return {
    idealRatio: clampRatio(parsed.idealRatio, FONT_SIZE_LIMITS.ideal, defaultFontSizeSettings.idealRatio),
    minimalRatio: clampRatio(parsed.minimalRatio, FONT_SIZE_LIMITS.minimal, defaultFontSizeSettings.minimalRatio),
  };
}

function deserialize(val: string | null): FontSizeSettings {
  if (!val) return defaultFontSizeSettings;
  try {
    return normalize(JSON.parse(val));
  } catch {
    return defaultFontSizeSettings;
  }
}

/** The root font size the ratios are relative to, in px. */
export function rootFontSize() {
  const size = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(size) && size > 0 ? size : 16;
}

/** The ideal and minimal body font size these settings ask for, in px. */
export function fontSizesOf(settings: FontSizeSettings) {
  const ideal = rootFontSize() * settings.idealRatio;
  return { ideal, minimal: ideal * settings.minimalRatio };
}

// `storage` events only fire in *other* tabs, so hook instances in this tab
// (the settings modal and the song being rendered behind it) are kept in sync
// through this set instead.
const subscribers = new Set<(settings: FontSizeSettings) => void>();

export function useFontSizeSettings() {
  const [settings, setSettings] = useState(() => deserialize(localStorage.getItem(key)));
  useEffect(() => {
    window.addEventListener("storage", listener);
    subscribers.add(setSettings);
    return () => {
      window.removeEventListener("storage", listener);
      subscribers.delete(setSettings);
    };
    function listener(event: StorageEvent) {
      if (event.key === key) setSettings(deserialize(event.newValue));
    }
  }, []);

  const change = useCallback((patch: Partial<FontSizeSettings>) => {
    const next = normalize({ ...deserialize(localStorage.getItem(key)), ...patch });
    localStorage.setItem(key, JSON.stringify(next));
    for (const subscriber of subscribers) subscriber(next);
  }, []);

  return useMemo(() => [settings, change] as const, [settings, change]);
}
