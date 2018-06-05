const cacheName = 'songbook-cache-v4'

self.addEventListener('install', e => {
  const timeStamp = Date.now()
  e.waitUntil(
    caches
      .open(cacheName)
      .then(cache =>
        cache
          .addAll([`/`, `/index.html`].concat(serviceWorkerOption.assets))
          .then(() => self.skipWaiting()),
      ),
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request))
    return
  }

  const parts = event.request.url.split('/')
  if (!/\./.exec(parts[parts.length - 1])) {
    // eslint-disable-next-line no-param-reassign
    event.request.url = '/'
    // load from cache but update cache from network
    event.respondWith(
      caches
        .open(cacheName)
        .then(cache => cache.match(event.request, { ignoreSearch: true }))
        .then(cacheResponse => {
          fetch(event.request.clone()).then(netResponse => {
            // Check if we received a valid response
            if (
              !netResponse ||
              netResponse.status !== 200 ||
              netResponse.type !== 'basic'
            ) {
              return netResponse
            }

            caches.open(cacheName).then(cache => {
              cache.put(event.request, netResponse)
            })
          })

          if (cacheResponse) {
            return cacheResponse
          }
        }),
    )
    return
  }
  console.log('Handling', event.request.url)
  event.respondWith(
    caches
      .open(cacheName)
      .then(cache => cache.match(event.request, { ignoreSearch: true }))
      .then(cacheResponse => {
        if (cacheResponse) {
          return cacheResponse
        }

        return fetch(event.request.clone()).then(netResponse => {
          // Check if we received a valid response
          if (
            !netResponse ||
            netResponse.status !== 200 ||
            netResponse.type !== 'basic'
          ) {
            return netResponse
          }

          const clone = netResponse.clone()
          caches.open(cacheName).then(cache => {
            cache.put(event.request, clone)
          })

          return netResponse
        })
      }),
  )
})
