import localForage from 'localforage'

type Loader<T> = () => Promise<T | { directive: 'clear-cache' }>

export default class ForageCache<T> {
  private key: string
  private loader: Loader<T>
  private cache: T | null = null
  private error: Error | null = null
  private promise: { initial: Promise<T | null> } | Promise<T> | null = null
  private listeners = [] as ((v: T) => void)[]

  constructor(key: string, loader: Loader<T>) {
    this.key = key
    this.loader = loader
    const promise = localForage
      .getItem<T>(key)
      .then(v => {
        this.promise = null
        this.cache = v
        this.listeners.forEach(l => l(v))
        return v
      })
      .catch(e => null)
    this.promise = { initial: promise }
  }

  getFromCache(): T | null {
    if (this.error) throw this.error
    return this.cache
  }

  load({ force = false } = {}): Promise<T> {
    if (!force && this.error) return Promise.reject(this.error)
    if (!force && this.cache) return Promise.resolve(this.cache)

    if (!this.promise || force || 'initial' in this.promise) {
      const prom = async () => {
        try {
          if (!force && this.cache) return this.cache
          const v = await this.loader()

          this.promise = null
          this.error = null
          if (v && typeof v === 'object' && 'directive' in v) {
            this.cache = null
            await localForage.removeItem(this.key)
            const error = new Error('Cache was cleared')
            ;(error as any).code = 'clear-cache'
            throw error
          } else {
            this.cache = v
            this.listeners.forEach(l => l(v))
            return localForage.setItem(this.key, v)
          }
        } catch (e) {
          // do not crash if we can use cache
          if (this.cache === null) {
            this.promise = null
            this.cache = null
            this.error = e
            throw e
          }
          return this.cache
        }
      }
      // if force wait for previous resolve (to avoid race conditions)
      // and then run stuff from this promise
      if (!this.promise) this.promise = prom()
      else if ('initial' in this.promise)
        this.promise = this.promise.initial.then(prom).catch(prom)
      else this.promise = this.promise.then(prom).catch(prom)
    }
    return this.promise
  }

  subscribe(onChange: (v: T) => void) {
    const handler = (v: T) => onChange(v)
    this.listeners.push(handler)
    return () => {
      this.listeners = this.listeners.filter(l => l !== handler)
    }
  }
}
