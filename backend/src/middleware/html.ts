import express from 'express'

import vm from 'vm'
import settings from '../settings'
import getFrontendFile from './get-frontend-file'

const mksource = (src: string) => `
;(() => {
const module = { exports: {} }
var exports = module.exports

${src};
return module.exports
})();
`

const lineOffset = (() => {
  let t = mksource('~tst~')
  t = t.substring(0, t.indexOf('~tst~'))
  return -t.split('\n').length
})()

const mkscript = (src: string) => {
  const script = new vm.Script(mksource(src), {
    filename: 'ssr/main.js', // filename for stack traces
    lineOffset, // line number offset to be used for stack traces
    columnOffset: 0, // column number offset to be used for stack traces
    displayErrors: true,
    timeout: 1000, // ms
  })
  return script.runInNewContext({
    require,
    console,
    Buffer,
    process,
    global,
  })
}

const loadScript = (() => {
  let cache: any | null = null
  return async () => {
    if (cache) return cache
    let file: string | false | undefined
    let map: any = false

    try {
      file = await getFrontendFile('/dist/index.ssr.js', true, 'utf-8')
      map = await getFrontendFile('/dist/index.ssr.js.map', true, 'utf-8')
    } catch (e) {
      console.log(e)
    }
    const ret = file ? mkscript(file) : null

    if (file) {
      ret.init(
        (url: string) =>
          console.log(url) ||
          (map && url === 'ssr/main.js' ? { url, map } : null),
      )
    }

    if (settings.serveStatic) cache = ret
    return ret
  }
})()

const loadJSON = (() => {
  const cache: { [key: string]: any } = {}
  return async (file: string) => {
    if (cache[file]) return cache[file]
    let ret: any = null

    try {
      const contents = await getFrontendFile(file, false, 'utf-8')
      ret = typeof contents === 'string' ? JSON.parse(contents) : null
    } catch (e) {
      console.log(e)
    }

    if (settings.serveStatic) cache[file] = ret
    return ret
  }
})()

const htmlMiddleware = () => (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  Promise.all([
    loadScript(),
    loadJSON('/dist/files.json'),
    loadJSON('/dist/react-loadable.json'),
  ])
    .then(([script, files, loadableJson]) => {
      if (!script) throw new Error('Failed to load script')
      if (!files) throw new Error('Failed to load files.json')
      if (!loadableJson) throw new Error('Failed to load loadableJson')

      return script.handleRequest({
        req,
        res,
        files,
        loadableJson,
        schema: undefined,
        context: {},
      })
    })
    .catch(e => next(e))
}
export default htmlMiddleware
