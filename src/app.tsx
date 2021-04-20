/** @jsx jsx */
import { jsx } from '@emotion/react'
import React, { Suspense } from 'react'
import Routes from 'routes/routes'
import { InstallProvider } from 'components/install'
import { css, Global } from '@emotion/react'
import OutlineHandler from 'utils/outline-handler'
import ErrorBoundary from 'containers/error-boundary'
import { StoreProvider } from 'store/store'

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
    `}
  />
)

export default () => (
  <React.Fragment>
    <OutlineHandler />
    <StoreProvider>
      <InstallProvider>
        <Suspense fallback={<div>Načítám...</div>}>
          <ErrorBoundary>
            <Routes />
          </ErrorBoundary>
        </Suspense>
      </InstallProvider>
    </StoreProvider>
  </React.Fragment>
)
