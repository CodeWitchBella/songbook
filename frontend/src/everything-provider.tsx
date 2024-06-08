import { DarkModeProvider } from "components/dark-mode";
import { InstallProvider } from "components/install";
import { LanguageProvider } from "components/localisation";
import { ServiceWorkerStatusProvider } from "components/service-worker-status";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { StoreProvider } from "store/store";
import OutlineHandler from "utils/outline-handler";

import * as serviceWorker from "./serviceWorker";

export function EverythingProvider({ children }: { children: ReactNode }) {
  return (
    <ServiceWorkerStatusProvider register={serviceWorker.register}>
      <DarkModeProvider>
        <LanguageProvider>
          <OutlineHandler />
          <StoreProvider>
            <InstallProvider>
              <Suspense
                fallback={
                  <div className="flex min-h-screen flex-col items-center justify-center text-3xl">
                    Načítám...
                  </div>
                }
              >
                {children}
              </Suspense>
            </InstallProvider>
          </StoreProvider>
        </LanguageProvider>
      </DarkModeProvider>
    </ServiceWorkerStatusProvider>
  );
}
