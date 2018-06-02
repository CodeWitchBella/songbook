import ReactDOM from 'react-dom'
import React from 'react'
import ErrorBoundary from 'containers/error-boundary'
import { HttpLink } from 'apollo-link-http'
import { ApolloLink } from 'apollo-link'
import { BrowserRouter as Router } from 'react-router-dom'
import Loadable from 'react-loadable'
import {
  Provider,
  createClient,
} from 'utils/react-simple-graphql/react-simple-graphql'
import 'scrollsnap-polyfill/dist/scrollsnap-polyfill.bundled'
import App from './app'
import handleOutline from './utils/outline-handler'

handleOutline()

/* global document */
const link = new HttpLink({ credentials: 'same-origin' })

function getObject(id: string) {
  const script = document.getElementById(id)
  if (!script) return undefined
  try {
    return JSON.parse(script.innerHTML)
  } catch (e) {
    console.error(e)
  }
  return undefined
}

const simpleClient = createClient({
  link,
  cache: getObject('__RSG_CACHE__'),
})

Loadable.preloadReady().then(() => {
  const app = document.getElementById('app')
  const render = app!.innerHTML !== '' ? ReactDOM.hydrate : ReactDOM.render
  render(
    <ErrorBoundary>
      <Provider client={simpleClient}>
        <Router>
          <App />
        </Router>
      </Provider>
    </ErrorBoundary>,
    app,
  )
})
