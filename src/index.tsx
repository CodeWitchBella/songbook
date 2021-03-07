import * as serviceWorker from './serviceWorker'

import ReactDOM from 'react-dom'
import React from 'react'
import { ErrorBoundary } from './containers/error-boundary'
import { BrowserRouter } from 'react-router-dom'
import App, { InjectGlobal } from './app'
import { ServiceWorkerStatusProvider } from './components/service-worker-status'

// workaround for something removing import React from 'react'
;(window as any).React = React

const app = document.getElementById('root')
ReactDOM.render(
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
  app,
)
