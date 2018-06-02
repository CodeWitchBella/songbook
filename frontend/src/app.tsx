import React from 'react'
import { hot } from 'react-hot-loader'
import { injectGlobal } from 'react-emotion'
import Routes from 'routes/routes'

// eslint-disable-next-line no-unused-expressions
injectGlobal`
  html, body {
    font-size: 4mm;
    margin: 0;
    padding: 0;
  }
`

export default hot(module)(Routes)
