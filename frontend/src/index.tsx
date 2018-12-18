import * as serviceWorker from './serviceWorker'

import ReactDOM from 'react-dom'
import React from 'react'
import ErrorBoundary from 'containers/error-boundary'
import { BrowserRouter as Router } from 'react-router-dom'
import Loadable from 'react-loadable'
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
      document.getElementById('root')!.innerHTML = `
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
      serviceWorker.unregister().then(() => {
        window.location.assign(
          `https://${currentHost}${window.location.pathname}`,
        )
      })
    }
  } else {
    serviceWorker.register({})
  }
}

if (!displayInstructions) {
  Loadable.preloadReady().then(() => {
    const app = document.getElementById('root')
    ReactDOM.render(
      <ErrorBoundary>
        <Router>
          <App />
        </Router>
      </ErrorBoundary>,
      app,
    )
  })
}
