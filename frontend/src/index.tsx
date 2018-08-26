import ReactDOM from 'react-dom'
import React from 'react'
import ErrorBoundary from 'containers/error-boundary'
import { BrowserRouter as Router } from 'react-router-dom'
import Loadable from 'react-loadable'
import runtime from 'serviceworker-webpack-plugin/lib/runtime'
import App from './app'
import handleOutline from './utils/outline-handler'

handleOutline()

const oldHosts = ['songbook.skorepa.info']
const currentHost = 'zpevnik.skorepova.info'

function unregister() {
  return navigator.serviceWorker
    .getRegistrations()
    .then(registrations => Promise.all(registrations.map(r => r.unregister)))
}

let displayInstructions = false
if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
  if (oldHosts.includes(window.location.host)) {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      displayInstructions = true
      document.getElementById('app')!.innerHTML = `
      <div style="font-size: 20px; padding: 10px;">
      Vypadá to, že že máte tento web nainstalovaný jako appku. Díky 😊<br/>
      Jelikož jsem web přesunula na novou adresu <a href="https://${currentHost}">${currentHost}</a>
      tak bude potřeba, abyste si appku odinstalovali a nainstalovali znova z
      této nové adresy. Omlouvám se za nepříjemnosti, ale lepší způsob (kromě
      zachování původní adresy) jsem bohužel nenašla. Díky za pochopení 😃
      <br/><br/>
      Isabella S.
      </div>
      `
    } else {
      unregister().then(() => {
        window.location.assign(
          `https://${currentHost}${window.location.pathname}`,
        )
      })
    }
  } else {
    runtime.register({ scope: '/' })
  }
}

if (!displayInstructions) {
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
}
