import React from 'react'
import { hot } from 'react-hot-loader'
import { injectGlobal } from 'react-emotion'
import Routes from 'routes/routes'
import { PrintPreviewProvider } from 'containers/print-preview'

// eslint-disable-next-line no-unused-expressions
injectGlobal`
  html, body {
    font-family: Cantarell;
    font-size: 2.542mm;
    margin: 0;
    padding: 0;
  }
`

export default hot(module)(() => (
  <PrintPreviewProvider>
    <Routes />
  </PrintPreviewProvider>
))
