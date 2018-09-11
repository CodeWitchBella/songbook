import React from 'react'
import createContext from 'utils/create-react-context'
import localForage from 'localforage'
import {
  everything_songs as SongType,
  everything_tags as SimpleTagType,
  everything_tags_songs as MiniSongType,
  everything as Everything,
} from 'queries-types'
import * as f from './fetchers'

export type SongType = SongType
export type TagType = {
  id: string
  name: string
  cover: string | null
  songs: SongType[]
}
export type SimpleTagType = SimpleTagType

type Context = {
  tagList: SimpleTagType[]
  refetch: (force?: boolean) => Promise<Everything | null>

  tags: {
    [tag: string]: TagType
  }

  songs: {
    [id: string]: SongType
  }
}

const context = createContext(null as null | Context)

const refetchAfter = 1000 * 60 * 60

const ric = (cb: () => void) => {
  if ('requestIdleCallback' in window) (window as any).requestIdleCallback(cb)
  else setTimeout(cb, 5000)
}

let listeners: (() => void)[] = []

if (typeof window !== 'undefined') {
  window.onstorage = () => {
    listeners.forEach(l => l())
  }
}

export class StoreProvider extends React.Component<{}, Context> {
  fetchTime: number = 0
  fetching: boolean = false

  state: Context = {
    refetch: (force: boolean = false) => {
      if (typeof document === 'undefined') return Promise.resolve(null)
      if ((this.fetchTime || 0) + refetchAfter >= Date.now() && !force)
        return Promise.resolve(null)
      if (this.fetching) return Promise.resolve(null)
      const lastFetchTime = this.fetchTime
      this.fetchTime = Date.now()
      this.fetching = true

      f.fetchEverything()
        .then(
          (v): any => {
            this.fetching = false
            if (v) {
              this.setStateFromEverything(v)
              return localForage.setItem('everything', v)
            }
            this.fetchTime = lastFetchTime
            return null
          },
        )
        .then(() => {
          try {
            localStorage.setItem('notify', new Date().toISOString())
          } catch (e) {}
        })
        .catch(e => {
          this.fetching = false
          this.fetchTime = lastFetchTime
          console.error(e)
        })

      return Promise.resolve(null)
    },
    tagList: [],
    tags: {},
    songs: {},
  }

  setStateFromEverything(everything: Everything) {
    const songs: {
      [id: string]: SongType
    } = {}
    everything.songs.forEach(song => {
      songs[song.id] = song
    })
    const tags: {
      [tag: string]: TagType
    } = {}
    everything.tags.forEach(tag => {
      tags[tag.id] = { ...tag, songs: tag.songs.map(({ id }) => songs[id]) }
    })

    this.setState({
      tagList: everything.tags,
      songs,
      tags,
    })
  }

  onStorage = () => {
    localForage
      .getItem('everything')
      .then((e: any) => this.setStateFromEverything(e))
  }

  componentDidMount() {
    this.state.refetch()
    localForage
      .getItem('everything')
      .then(val => {
        if (val) this.setStateFromEverything(val as Everything)
      })
      .catch(e => console.error(e))
    listeners.push(this.onStorage)
  }

  componentWillUnmount() {
    listeners = listeners.filter(l => l !== this.onStorage)
  }

  render() {
    return (
      <context.Provider value={this.state}>
        {this.props.children}
      </context.Provider>
    )
  }
}

// this is here to reduce boilerplate ;-)
const makeConsumer = <P, T>(
  res: (
    ctx: Context,
    props: { children: (v: T) => React.ReactNode } & P,
  ) => React.ReactNode,
) => (props: { children: (v: T) => React.ReactNode } & P) => (
  <context.Consumer>
    {ctx => {
      if (!ctx) throw new Error('This needs StoreProvider')

      return res(ctx, props)
    }}
  </context.Consumer>
)
export const Tag = makeConsumer<{ id: string }, TagType | null>(
  (ctx, { children, id }) => {
    ctx.refetch()
    return children(ctx.tags[id] || null)
  },
)

export const TagList = makeConsumer<{}, SimpleTagType[]>(
  (ctx, { children }) => {
    ctx.refetch()
    return children(ctx.tagList)
  },
)

export const SongsInTag = makeConsumer<{ tag: string }, SongType[]>(
  (ctx, { children, tag }) => {
    ctx.refetch()
    return children((ctx.tags[tag] && ctx.tags[tag].songs) || [])
  },
)

export const Song = makeConsumer<{ id: string }, SongType | null>(
  (ctx, { children, id }) => {
    ctx.refetch()
    return children(ctx.songs[id] || null)
  },
)

export const Refetch = makeConsumer<
  {},
  ((force?: boolean) => Promise<Everything | null>)
>((ctx, { children }) => {
  ctx.refetch()
  return children(ctx.refetch)
})

export const Songs = makeConsumer<{ ids: string[] }, SongType[]>(
  (ctx, { children, ids }) => {
    ctx.refetch()
    return children(ids.map(id => ctx.songs[id] || null).filter(a => a))
  },
)
