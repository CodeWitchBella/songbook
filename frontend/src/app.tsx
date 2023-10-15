/** @jsxImportSource @emotion/react */

import { css, Global } from '@emotion/react'
import { DarkModeProvider } from 'components/dark-mode'
import { InstallProvider } from 'components/install'
import { LanguageProvider } from 'components/localisation'
import ErrorBoundary from 'containers/error-boundary'
import React, { Suspense } from 'react'
import Routes from 'routes/routes'
import { StoreProvider } from 'store/store'
import OutlineHandler from 'utils/outline-handler'

export default function App() {
  return (
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
              <ErrorBoundary>
                <Routes />
              </ErrorBoundary>
            </Suspense>
          </InstallProvider>
        </StoreProvider>
      </LanguageProvider>
    </DarkModeProvider>
  )
}
