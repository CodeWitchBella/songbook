//import { Buffer } from 'buffer'
import 'inter-ui/inter.css'
import './index.css'

import { ServiceWorkerStatusProvider } from 'components/service-worker-status'
import ErrorBoundary from 'containers/error-boundary'
import React from 'react'
import * as ReactDOM from 'react-dom/client'
import Loadable from 'react-loadable'
import { BrowserRouter } from 'react-router-dom'

import App, { InjectGlobal } from './app'
import * as serviceWorker from './serviceWorker'

// workaround for something removing import React from 'react'
;(window as any).React = React
//;(window as any).global = window
//window.process = { env: { NODE_ENV: 'production' }, nextTick: (cb) => Promise.resolve().then(cb) } as any
//window.Buffer = Buffer

Loadable.preloadReady().then(() => {
  const app = document.getElementById('root')!
  const root = ReactDOM.createRoot(app)
  root.render(
    <React.Fragment>
      <InjectGlobal />
      <ErrorBoundary>
        <BrowserRouter>
          <ServiceWorkerStatusProvider register={serviceWorker.register}>
            <App />
          </ServiceWorkerStatusProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.Fragment>,
  )
})
