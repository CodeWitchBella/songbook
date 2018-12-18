import React from 'react'
import { injectGlobal, cache } from 'emotion'
import Routes from 'routes/routes'
import { PrintPreviewProvider } from 'containers/print-preview'
import { StoreProvider } from 'containers/store/store'
//import printSongbook from 'pdf/songbook'
import { InstallProvider } from 'components/install'
import { CacheProvider } from '@emotion/core'

// eslint-disable-next-line no-unused-expressions
injectGlobal`
  html, body, #root {
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
`

//printSongbook([])

export default () => (
  <CacheProvider value={cache}>
    <InstallProvider>
      <StoreProvider>
        <PrintPreviewProvider>
          <Routes />
        </PrintPreviewProvider>
      </StoreProvider>
    </InstallProvider>
  </CacheProvider>
)
