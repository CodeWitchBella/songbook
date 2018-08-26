import ReactDOM from 'react-dom'
import React from 'react'
import ErrorBoundary from 'containers/error-boundary'
import { BrowserRouter as Router } from 'react-router-dom'
import Loadable from 'react-loadable'
import runtime from 'serviceworker-webpack-plugin/lib/runtime'
import App from './app'
import handleOutline from './utils/outline-handler'

handleOutline()

Loadable.preloadReady().then(() => {
  const app = document.getElementById('app')
  const render = app!.innerHTML !== '' ? ReactDOM.hydrate : ReactDOM.render
  render(
    <ErrorBoundary>
      <Router>
        <App />
      </Router>
    </ErrorBoundary>,
    app,
  )
})

const oldHosts = ['songbook.skorepa.info']
const currentHost = 'zpevnik.skorepova.info'

if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
  if (oldHosts.includes(window.location.host)) {
    navigator.serviceWorker
      .getRegistrations()
      .then(registrations => Promise.all(registrations.map(r => r.unregister)))
      .then(() => {
        window.location.assign(
          `https://${currentHost}${window.location.pathname}`,
        )
      })
  } else {
    runtime.register({ scope: '/' })
  }
}
