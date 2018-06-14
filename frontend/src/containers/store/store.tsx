import React from 'react'
import createContext from 'utils/create-react-context'
import localForage from 'localforage'
import * as f from './fetchers'
import {
  everything_songs as SongType,
  everything_tags as Tag,
  everything_tags_songs as MiniSongType,
  everything as Everything,
} from './__generated__/everything'

export type SongType = SongType
export type Tag = Tag

type Context = {
  tagList: Tag[]
  refetch: () => Promise<Everything | null>

  tags: {
    [tag: string]: SongType[]
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

export class StoreProvider extends React.Component<{}, Context> {
  fetchTime: number = 0

  state: Context = {
    refetch: () => {
      if (typeof document === 'undefined') return Promise.resolve(null)
      if ((this.fetchTime || 0) + refetchAfter >= Date.now())
        return Promise.resolve(null)
      const lastFetchTime = this.fetchTime
      this.fetchTime = Date.now()

      f.fetchEverything()
        .then(
          (v): any => {
            if (v) {
              this.setStateFromEverything(v)
              return localForage.setItem('everything', v)
            }
            this.fetchTime = lastFetchTime
            return null
          },
        )
        .catch(e => {
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
      [tag: string]: SongType[]
    } = {}
    everything.tags.forEach(tag => {
      tags[tag.id] = tag.songs.map(({ id }) => songs[id])
    })

    this.setState({
      tagList: everything.tags,
      songs,
      tags,
    })
  }

  componentDidMount() {
    this.state.refetch()
    localForage
      .getItem('everything')
      .then(val => {
        if (val) this.setStateFromEverything(val as Everything)
      })
      .catch(e => console.error(e))
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

export const TagList = makeConsumer<{}, Tag[]>((ctx, { children }) => {
  ctx.refetch()
  return children(ctx.tagList)
})

export const SongsInTag = makeConsumer<{ tag: string }, MiniSongType[]>(
  (ctx, { children, tag }) => {
    ctx.refetch()
    return children(ctx.tags[tag] || [])
  },
)

export const Song = makeConsumer<{ id: string }, SongType | null>(
  (ctx, { children, id }) => {
    ctx.refetch()
    return children(ctx.songs[id] || null)
  },
)

export const Songs = makeConsumer<{ ids: string[] }, SongType[]>(
  (ctx, { children, ids }) => {
    ctx.refetch()
    return children(ids.map(id => ctx.songs[id] || null).filter(a => a))
  },
)
