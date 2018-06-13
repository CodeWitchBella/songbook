import React from 'react'
import { hot } from 'react-hot-loader'
import { injectGlobal } from 'react-emotion'
import Routes from 'routes/routes'
import { PrintPreviewProvider } from 'containers/print-preview'
import { StoreProvider } from 'containers/store/store'
import printSongbook from 'pdf/songbook'

// eslint-disable-next-line no-unused-expressions
injectGlobal`
  html, body, #app {
    font-family: Cantarell;
    font-size: 2.542mm;
    margin: 0;
    padding: 0;
    @media not print {
      width: 100%;
      height: 100%;
    }
  }
  #app {
    @media not print {
      overflow: auto;
    }
  }
`

printSongbook([])

export default hot(module)(() => (
  <StoreProvider>
    <PrintPreviewProvider>
      <Routes />
    </PrintPreviewProvider>
  </StoreProvider>
))
