import { DateTime } from 'luxon'
import localForage from 'localforage'

const storage = localForage.createInstance({ name: 'store' })

type MinItem = { slug: string; id: string; lastModified: DateTime }

export type WithMethods<Item> = {
  refresh: () => void
  setRemoteLastModified: (lm: DateTime) => void
  item: Item
}

type Config<Item extends MinItem, Serialized> = {
  loadInitial: () => Promise<Item[]>
  loadIncremental: (
    after: DateTime,
  ) => Promise<{ changed: Item[]; deleted: { id: string }[] }>
  serialize: (item: Item) => Serialized
  deserialize: (item: Serialized) => Item
  cacheKey: string
  onLoadedFromCache?: () => void
}

type Cache<Serialized> = { items: Serialized[] }

// FullItem = ItemBase & ExtensionInitial & ExtensionFull
export class GenericStore<Item extends MinItem, Serialized> {
  private _config: Config<Item, Serialized>
  private _initPromise: Promise<void>
  constructor(config: Config<Item, Serialized>) {
    this._config = config
    this._initPromise = this._init()
  }

  private _bySlug = new Map<string, WithMethods<Item>>()
  private _byId = new Map<string, WithMethods<Item>>()
  private _readAllCache: WithMethods<Item>[] | null = null
  private _lastModified: DateTime | null = null
  private _changeCounter = 0

  private _setItem(item: Item, { save = true } = {}) {
    const prev = this._byId.get(item.id)
    if (prev && prev.item.lastModified >= item.lastModified) {
      return
    }
    const v = {
      refresh: () => {
        this.refresh()
      },
      setRemoteLastModified: (date: DateTime) => {
        const cur = this._byId.get(item.id)
        if (!cur || cur.item.lastModified < date) this.refresh()
      },
      item,
    }
    this._byId.set(item.id, v)
    this._bySlug.set(item.slug, v)
    this._changeCounter++
    this._readAllCache = null
    if (this._lastModified === null || this._lastModified < item.lastModified)
      this._lastModified = item.lastModified

    this._triggerOnChange(save)
  }

  private _rmItem(id: string) {
    const item = this._byId.get(id)
    if (!item) return
    this._byId.delete(id)
    this._bySlug.delete(item.item.slug)
    this._changeCounter++
    this._readAllCache = null
    this._triggerOnChange()
  }

  private _initing = false
  private _init() {
    this._initing = true
    return storage
      .getItem<Cache<Serialized> | null>(this._config.cacheKey)
      .then(cached => {
        const items = (cached ? cached.items : []).map(this._config.deserialize)

        for (const item of items) {
          this._setItem(item, { save: false })
        }
      })
      .catch((e: any) => console.error(e))
      .then(() => {
        this._initing = false
        if (this._config.onLoadedFromCache) this._config.onLoadedFromCache()
        this.refresh()
      })
  }

  private _refreshing = false
  private _scheduleRefresh: (() => void)[] = []
  refresh() {
    const ret = new Promise<void>(res => {
      this._scheduleRefresh.push(res)
    })
    this._scheduleRefresh.push()
    if (!this._refreshing) {
      this._refreshing = true
      const onDone = this._scheduleRefresh
      this._scheduleRefresh = []

      Promise.resolve()
        .then(() => {
          if (this._lastModified)
            return this._config.loadIncremental(this._lastModified)
          return this._config
            .loadInitial()
            .then(changed => ({ changed, deleted: [] }))
        })
        .then(items => {
          for (const item of items.deleted) this._rmItem(item.id)
          for (const item of items.changed) this._setItem(item)
        })
        .catch((e: any) => console.error(e))
        .then(() => {
          onDone.forEach(f => f())
          this._refreshing = false
          if (this._scheduleRefresh.length > 0) this.refresh()
        })
    }
    return ret
  }

  readById(id: string) {
    return this._byId.get(id)
  }

  readBySlug(slug: string) {
    return this._bySlug.get(slug)
  }

  readAll() {
    if (!this._readAllCache)
      this._readAllCache = Array.from(this._byId.values())
    return this._readAllCache
  }

  private _lastEmittedChange = -1
  private _triggerOnChange(save = true) {
    setImmediate(() => {
      if (this._lastEmittedChange === this._changeCounter) return
      this._lastEmittedChange = this._changeCounter
      if (save) this._save()

      this._handlers.forEach(h => {
        if (this._handlers.includes(h)) h()
      })
    })
  }

  private _lastSavedChange = -1
  private _saving = false
  private _save() {
    setImmediate(() => {
      if (this._lastSavedChange === this._changeCounter || this._saving) return
      this._saving = true

      const cached: Cache<Serialized> = {
        items: this.readAll()
          .map(v => v.item)
          .map(this._config.serialize),
      }
      storage
        .setItem(this._config.cacheKey, cached)
        .then(() => {
          this._lastSavedChange = this._changeCounter
        })
        .catch(e => console.error(e))
        .then(() => {
          if (this._lastSavedChange !== this._changeCounter) {
            setTimeout(() => this._save(), 500)
          }
        })
    })
  }

  private _handlers: (() => void)[] = []
  onChange(handler: () => void) {
    const v = () => handler()
    this._handlers.push(v)
    return () => {
      this._handlers = this._handlers.filter(h => h !== v)
    }
  }
}
