/** @jsx jsx */
import { jsx } from '@emotion/core'
import React, { Suspense } from 'react'
import { cache } from 'emotion'
import Routes from 'routes/routes'
import { PrintPreviewProvider } from 'containers/print-preview'
import { InstallProvider } from 'components/install'
import { CacheProvider, css, Global } from '@emotion/core'
import OutlineHandler from 'utils/outline-handler'
import ErrorBoundary from 'containers/error-boundary'
import { StoreProvider } from 'store/store'
import ServiceWorkerUpdated from 'components/service-worker-updated'

import cantarellRegularWoff from './webfonts/cantarell-regular.woff'
import cantarellRegularWoff2 from './webfonts/cantarell-regular.woff2'
import cantarellBoldWoff from './webfonts/cantarell-bold.woff'
import cantarellBoldWoff2 from './webfonts/cantarell-bold.woff2'

export const InjectGlobal = () => (
  <Global
    styles={css`
      @font-face {
        font-family: 'Cantarell';
        src: url('${cantarellRegularWoff2}') format('woff2'),
          url('${cantarellRegularWoff}') format('woff');
        font-weight: normal;
        font-style: normal;
      }

      @font-face {
        font-family: 'Cantarell';
        src: url('${cantarellBoldWoff2}') format('woff2'),
          url('${cantarellBoldWoff}') format('woff');
        font-weight: bold;
        font-style: normal;
      }

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
      <StoreProvider>
        <InstallProvider>
          <PrintPreviewProvider>
            <Suspense fallback={<div>Načítám...</div>}>
              <ErrorBoundary>
                <ServiceWorkerUpdated />
                <Routes />
              </ErrorBoundary>
            </Suspense>
          </PrintPreviewProvider>
        </InstallProvider>
      </StoreProvider>
    </CacheProvider>
  </React.Fragment>
)
