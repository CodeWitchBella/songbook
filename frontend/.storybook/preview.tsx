import "../src/index.css";

import { DarkModeProvider } from "#/components/dark-mode";
import { InstallProvider } from "#/components/install";
import { LanguageProvider } from "#/components/localisation";
import { ServiceWorkerStatusProvider } from "#/components/service-worker-status";
import { StoreProvider } from "#/store/store";
import OutlineHandler from "#/utils/outline-handler";
import { getColors } from "#/components/themed";
import type { Preview } from "@storybook/react-vite";
import i18n from "i18next";
import type { ReactNode } from "react";
import { Suspense, useEffect, useLayoutEffect } from "react";
import { MemoryRouter, Route, Routes } from "react-router";

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    // We drive the background ourselves from the app palette (see ThemeFrame),
    // so disable Storybook's built-in white/black background swatches.
    backgrounds: { disable: true },
  },
  globalTypes: {
    theme: {
      description: "App color theme",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun", title: "Light" },
          { value: "dark", icon: "moon", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: "App language",
      defaultValue: "cs",
      toolbar: {
        title: "Language",
        icon: "globe",
        items: [
          { value: "cs", title: "Čeština", right: "CS" },
          { value: "en", title: "English", right: "EN" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => (
      <ThemeFrame dark={context.globals.theme === "dark"}>
        <LocaleSync locale={context.globals.locale === "en" ? "en" : "cs"} />
        {Story()}
      </ThemeFrame>
    ),
    (Story, context) => (
      <ServiceWorkerStatusProvider register={() => {}}>
        <DarkModeProvider>
          <LanguageProvider>
            <OutlineHandler />
            <StoreProvider>
              <InstallProvider>
                <MemoryRouter initialEntries={[context.parameters.route ?? "/"]}>
                  <Suspense fallback={<div className="p-4">Načítám…</div>}>
                    <Routes>
                      <Route path={context.parameters.path ?? "*"} element={<Story />} />
                    </Routes>
                  </Suspense>
                </MemoryRouter>
              </InstallProvider>
            </StoreProvider>
          </LanguageProvider>
        </DarkModeProvider>
      </ServiceWorkerStatusProvider>
    ),
  ],
};

export default preview;

// Mirrors the app's theming: toggles the `dark` class + native color-scheme on
// the document (so Tailwind `dark:` variants and DarkModeProvider agree) and
// paints the canvas with the same background/text colors the app uses.
function ThemeFrame({ dark, children }: { dark: boolean; children: ReactNode }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
    localStorage.setItem("dark-mode-setting", dark ? "dark" : "light");
  }, [dark]);

  const colors = getColors(dark);
  return (
    <div style={{ background: colors.background, color: colors.text, minHeight: "100vh" }}>
      {children}
    </div>
  );
}

// Drives the app language from the toolbar. LanguageProvider only reacts to
// cross-window `storage` events, so we also call its exposed `setLng` (and
// i18n directly) to switch within this window.
function LocaleSync({ locale }: { locale: "cs" | "en" }) {
  useEffect(() => {
    if (locale === "cs") localStorage.removeItem("language");
    else localStorage.setItem("language", locale);
    (window as any).setLng?.(locale);
    void i18n.changeLanguage(locale);
  }, [locale]);
  return null;
}
