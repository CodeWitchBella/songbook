import { createContext, useContext, useEffect, useMemo, useState } from "react";

const key = "dark-mode-setting";
const query = "(prefers-color-scheme: dark)";

function deserialize(val: string | null): DarkModeSetting {
  if (val === "light" || val === "dark") return val;
  return "automatic";
}

function write(val: DarkModeSetting) {
  if (val === "light" || val === "dark") localStorage.setItem(key, val);
  else localStorage.removeItem(key);
}

function apply(setting?: DarkModeSetting, prefersDark?: boolean) {
  prefersDark ??= window.matchMedia(query).matches;
  setting ??= deserialize(localStorage.getItem(key));
  const dark = setting === "automatic" ? prefersDark : setting === "dark";

  if (dark) document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}

type DarkModeSetting = "automatic" | "light" | "dark";
const darkModeContext = createContext<{
  value: boolean;
  setting: DarkModeSetting;
  setSetting: (v: DarkModeSetting) => void;
}>({ value: false, setting: "light", setSetting: () => {} });
export function DarkModeProvider({
  children,
}: {
  children: JSX.Element | readonly JSX.Element[];
}) {
  const [urlValue] = useState(() => {
    if (new URLSearchParams(window.location.search).has("light"))
      return { bool: false, string: "light" as const };
    return null;
  });
  const [setting, setSetting] = useState(() =>
    deserialize(localStorage.getItem(key)),
  );
  useEffect(() => {
    window.addEventListener("storage", listener);
    return () => void window.removeEventListener("storage", listener);
    function listener(event: StorageEvent) {
      if (event.key === key) {
        const value = deserialize(event.newValue);
        setSetting(value);
        apply(urlValue?.string ?? value);
      }
    }
  }, [urlValue]);

  const [systemPreference, setSystemPreference] = useState(
    () => !!window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = () => {
      const newPreference = !!mediaQuery.matches;
      setSystemPreference(newPreference);
      apply(urlValue?.string ?? undefined, newPreference);
    };
    handler();
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [systemPreference, urlValue?.string]);

  const resolvedValue =
    setting === "automatic" ? systemPreference : setting === "dark";
  return (
    <darkModeContext.Provider
      value={useMemo(
        () => ({
          value: urlValue?.bool ?? resolvedValue,
          setting,
          setSetting: (value) => {
            setSetting(value);
            apply(value);
            write(value);
          },
        }),
        [resolvedValue, setting, urlValue],
      )}
    >
      {children}
    </darkModeContext.Provider>
  );
}
export function useDarkModeSetting() {
  return useContext(darkModeContext);
}
