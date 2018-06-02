import sms from 'source-map-support'

export const init = (retrieveSourceMap: any) => {
  sms.install({ retrieveSourceMap, environment: 'node' })
}

export const handleRequest = (arg: any) =>
  import('./template').then(handler => handler.default(arg))
