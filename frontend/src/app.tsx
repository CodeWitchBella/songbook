import React, { Suspense } from 'react'
import { injectGlobal, cache } from 'emotion'
import Routes from 'routes/routes'
import { PrintPreviewProvider } from 'containers/print-preview'
import { SongListProvider } from 'store/list-provider'
//import printSongbook from 'pdf/songbook'
import { InstallProvider } from 'components/install'
import { CacheProvider } from '@emotion/core'
import { listSongs } from 'store/azure'
import { SongProvider } from 'store/song-provider'

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

export default () => (
  <Suspense fallback={<div>Načítám...</div>}>
    <CacheProvider value={cache}>
      <SongListProvider>
        <SongProvider>
          <InstallProvider>
            <PrintPreviewProvider>
              <Routes />
            </PrintPreviewProvider>
          </InstallProvider>
        </SongProvider>
      </SongListProvider>
    </CacheProvider>
  </Suspense>
)
