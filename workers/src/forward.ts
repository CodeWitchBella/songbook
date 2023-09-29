export async function forward(
  request: Request,
  target: string,
): Promise<Response> {
  if (request.method !== 'GET')
    return new Response('Method not allowed', { status: 405 })

  const requestHeaders = new Headers()
  copyHeader('if-modified-since', request.headers, requestHeaders)
  copyHeader('if-none-match', request.headers, requestHeaders)
  const res = await fetch(target, { headers: requestHeaders })
  const responseHeaders = new Headers()
  copyHeader('cache-control', res.headers, responseHeaders)
  copyHeader('last-modified', res.headers, responseHeaders)
  copyHeader('etag', res.headers, responseHeaders)
  return new Response(res.body, {
    headers: responseHeaders,
    status: res.status,
  })
}

function copyHeader(name: string, source: Headers, target: Headers) {
  const value = source.get(name)
  if (value) {
    target.set(name, value)
  }
}
