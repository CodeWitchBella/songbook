import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { SchemaLink } from 'apollo-link-schema'
import { StaticRouter } from 'react-router-dom'
import { renderStylesToNodeStream } from 'emotion-server'
import Loadable from 'react-loadable'
import reactTreeWalker from 'react-tree-walker'
import gql from 'graphql-tag'
// this is only used for typings and real dependecy is injected in server side rending
// eslint-disable-next-line import/no-extraneous-dependencies
import { Request, Response } from 'express'
import {
  Provider,
  createClient,
  isQueryComponent,
} from 'utils/react-simple-graphql/react-simple-graphql'
import App from './app'

const delimiter = '---app-delimiter---'

const Scripts: React.SFC<{ list: string[] }> = ({ list }) => (
  <>{list.map((src, id) => <script key={id + 2} src={src} defer />)}</>
)

const NotDev: React.SFC<{ dev: boolean }> = ({ dev, children }) =>
  dev ? null : <>{children}</>

/* this react component is server-side rendered on every request */
const Template = ({ scripts }: { scripts: string[] }) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <title>Songbook</title>
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, minimum-scale=1.0"
      />

      <link rel="shortcut icon" href="/favicon.ico" />

      {delimiter}
    </head>
    <body>
      {/* we can start loading vendor chunk before we SSR */}
      <script src={scripts[0]} defer />

      <div id="app" dangerouslySetInnerHTML={{ __html: delimiter }} />

      {delimiter}
      <Scripts list={scripts.slice(1)} />
    </body>
  </html>
)

function exportGlobalObject(name: string, value: any): string {
  const json = JSON.stringify(value)
  return `<script type="application/json" id="${name}">${json}</script>`
}

function unique() {
  const visited: string[] = []
  return (str: string): boolean => {
    if (visited.includes(str)) return false
    visited.push(str)
    return true
  }
}

export default async ({
  files,
  schema,
  res,
  req,
  loadableJson,
  context,
}: {
  files: { js: string[]; polyfillHash: string }
  schema: any
  res: Response
  req: Request
  loadableJson: any
  context: any
}) => {
  const link = new SchemaLink({ schema, context })

  const simpleClient = createClient({ link })

  const hostname = req.hostname.replace(/^test\./, '')
  const url = `${req.protocol}://${req.hostname}${req.url.split('?')[0]}`

  const markup = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Template, {
      scripts: files.js,
    }),
  )
  const parts = markup.split(delimiter)
  res.write('<!DOCTYPE html>\n')
  res.write(parts[0])

  await Loadable.preloadAll()

  const loadableModules: string[] = []
  let simpleClientTag: string = '<!-- SSR is disabled -->'
  let errorTag = '<!-- ok -->'
  const ssr = !/\?nossr/.exec(req.url)
  if (ssr) {
    // component which will be rendered
    const app = (
      <Loadable.Capture
        report={moduleName => {
          loadableModules.push(moduleName)
        }}
      >
        <StaticRouter location={req.url} context={{}}>
          <Provider client={simpleClient}>
            <App />
          </Provider>
        </StaticRouter>
      </Loadable.Capture>
    )

    // this does not work with some our component, so we reimplement it in more
    // robust way using reactTreeWalker
    //await getDataFromTree(app)
    await reactTreeWalker(app, (element: JSX.Element, instance: any) => {
      if (!instance) return undefined
      if (isQueryComponent(instance)) {
        const data = instance.fetchData()
        if (data && typeof data.then === 'function') {
          return data.catch(() => {}) // we dont care about gql errors in SSR
        }
      }
      return undefined
    })

    // render
    res.write(parts[1])
    const stream = ReactDOMServer.renderToNodeStream(app)

    await new Promise(resolve => {
      const onError = (err: any) => {
        errorTag = '<!-- error occured -->'
        console.error(err)
        resolve()
      }
      stream.on('error', onError)
      stream
        .pipe(renderStylesToNodeStream(app))
        .on('error', onError)
        .on('end', resolve)
        .pipe(res, { end: false })
        .on('error', onError)
    })

    simpleClientTag = exportGlobalObject(
      '__RSG_CACHE__',
      simpleClient.getCache(),
    )
  } else {
    res.write(parts[1])
  }

  res.write(
    [
      parts[2],
      errorTag,
      loadableModules
        .map(mod => loadableJson[mod])
        .reduce((arr, mod) => arr.concat(mod), [])
        .filter((a: any) => a)
        .map((mod: any) => mod.publicPath)
        .filter((src: any) => typeof src === 'string' && /\.js$/.exec(src))
        .filter(unique())
        .map(
          (src: string) =>
            `<script src="${/^\//.exec(src) ? '' : '/'}${src}" defer></script>`,
        )
        .join('\n'),
      simpleClientTag,
      parts[3],
    ].join('\n'),
  )
  res.end()
}
