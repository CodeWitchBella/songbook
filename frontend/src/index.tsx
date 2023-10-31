import 'inter-ui/inter.css'
import './index.css'

import React from 'react'
import * as ReactDOM from 'react-dom/client'
import Loadable from 'react-loadable'
import { Routes } from 'routes/routes'

import { EverythingProvider } from './everything-provider'

// workaround for something removing import React from 'react'
;(window as any).React = React
//;(window as any).global = window
//window.process = { env: { NODE_ENV: 'production' }, nextTick: (cb) => Promise.resolve().then(cb) } as any
//window.Buffer = Buffer

Loadable.preloadReady().then(() => {
  const app = document.getElementById('root')!
  const root = ReactDOM.createRoot(app)
  root.render(
    <EverythingProvider>
      <Routes />
    </EverythingProvider>,
  )
})
