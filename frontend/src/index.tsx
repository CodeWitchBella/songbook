import ReactDOM from 'react-dom'
import React from 'react'
import ErrorBoundary from 'containers/error-boundary'
import { BrowserRouter as Router } from 'react-router-dom'
import Loadable from 'react-loadable'
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
