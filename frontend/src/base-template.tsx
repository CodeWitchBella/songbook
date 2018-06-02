import React from 'react'

const Scripts: React.SFC<{ list: string[] }> = ({ list }) => (
  <>{list.map((src, id) => <script key={id + 2} src={src} defer />)}</>
)

const NotDev: React.SFC<{ dev: boolean }> = ({ dev, children }) =>
  dev ? null : <>{children}</>

const BaseTemplate: React.SFC<{
  title?: string
  delimiter?: string
  scripts: string[]
}> = ({ title = 'Rekonstrukce státu', scripts, delimiter = '' }) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <title>{title}</title>
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
export default BaseTemplate
