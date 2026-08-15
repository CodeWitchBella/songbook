import { useCallback, useEffect, useMemo, useState } from "react";

const key = "font-size-settings";

export type FontSizeSettings = {
  /** the font is grown as much as fits; below this size (px) the song spills onto another page instead */
  minFontSize: number;
  /** when false, the font is scaled down until even the longest line fits unwrapped */
  allowLineWrap: boolean;
  /** with wrapping on: below this size (px) long lines wrap instead of shrinking further */
  wrapBelowFontSize: number;
};

export const FONT_SIZE_LIMITS = { min: 6, max: 40, step: 1 } as const;

export const defaultFontSizeSettings: FontSizeSettings = {
  minFontSize: 14,
  allowLineWrap: false,
  wrapBelowFontSize: 14,
};

function clampSize(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(FONT_SIZE_LIMITS.max, Math.max(FONT_SIZE_LIMITS.min, value));
}

function normalize(parsed: any): FontSizeSettings {
  if (!parsed || typeof parsed !== "object") return defaultFontSizeSettings;
  return {
    minFontSize: clampSize(parsed.minFontSize, defaultFontSizeSettings.minFontSize),
    allowLineWrap: !!parsed.allowLineWrap,
    wrapBelowFontSize: clampSize(parsed.wrapBelowFontSize, defaultFontSizeSettings.wrapBelowFontSize),
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

export function useFontSizeSettings() {
  const [settings, setSettings] = useState(() => deserialize(localStorage.getItem(key)));
  useEffect(() => {
    window.addEventListener("storage", listener);
    return () => {
      window.removeEventListener("storage", listener);
    };
    function listener(event: StorageEvent) {
      if (event.key === key) setSettings(deserialize(event.newValue));
    }
  }, []);

  const change = useCallback((patch: Partial<FontSizeSettings>) => {
    setSettings(prev => {
      const next = normalize({ ...prev, ...patch });
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, []);

  return useMemo(() => [settings, change] as const, [settings, change]);
}
