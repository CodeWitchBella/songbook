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

import cantarellBoldWoff from './webfonts/cantarell-bold.woff'
import cantarellBoldWoff2 from './webfonts/cantarell-bold.woff2'
import cantarellRegularWoff from './webfonts/cantarell-regular.woff'
import cantarellRegularWoff2 from './webfonts/cantarell-regular.woff2'

export const InjectGlobal = () => (
  <Global
    styles={css`
      @font-face {
        font-family: 'Cantarell';
        src:
          url('${cantarellRegularWoff2}') format('woff2'),
          url('${cantarellRegularWoff}') format('woff');
        font-weight: normal;
        font-style: normal;
      }

      @font-face {
        font-family: 'Cantarell';
        src:
          url('${cantarellBoldWoff2}') format('woff2'),
          url('${cantarellBoldWoff}') format('woff');
        font-weight: bold;
        font-style: normal;
      }

      html,
      body,
      #root {
        margin: 0;
        padding: 0;
        @media not print {
          width: 100%;
          height: 100%;
        }
      }
    `}
  />
)

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
