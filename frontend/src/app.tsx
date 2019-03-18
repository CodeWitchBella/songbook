/** @jsx jsx */
import { jsx } from '@emotion/core'
import React, { Suspense } from 'react'
import { cache } from 'emotion'
import Routes from 'routes/routes'
import { PrintPreviewProvider } from 'containers/print-preview'
import { SongListProvider } from 'store/list-provider'
import { InstallProvider } from 'components/install'
import { CacheProvider, css, Global } from '@emotion/core'
import { SongProvider } from 'store/song-provider'
import OutlineHandler from 'utils/outline-handler'
import ErrorBoundary from 'containers/error-boundary'

export const InjectGlobal = () => (
  <Global
    styles={css`
      html,
      body,
      #root {
        font-family: Cantarell;
        font-size: 2.542mm;
        margin: 0;
        padding: 0;
        @media not print {
          width: 100%;
          height: 100%;
        }
      }
      #root {
        @media not print {
          overflow: auto;
        }
      }
    `}
  />
)

export default () => (
  <React.Fragment>
    <OutlineHandler />
    <CacheProvider value={cache}>
      <SongListProvider>
        <SongProvider>
          <InstallProvider>
            <PrintPreviewProvider>
              <Suspense fallback={<div>Načítám...</div>}>
                <ErrorBoundary>
                  <Routes />
                </ErrorBoundary>
              </Suspense>
            </PrintPreviewProvider>
          </InstallProvider>
        </SongProvider>
      </SongListProvider>
    </CacheProvider>
  </React.Fragment>
)
