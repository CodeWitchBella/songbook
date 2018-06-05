import React from 'react'
import createContext from 'utils/create-react-context'
import { fullSongs_songs as SongType } from './__generated__/fullSongs'
import * as f from './fetchers'
import { tagList_tags as Tag } from './__generated__/tagList'
import { tag_tag_songs as MiniSongType } from './__generated__/tag'

export type SongType = SongType
export type Tag = Tag

type Context = {
  tagList: Tag[]
  fetchTagList: () => Promise<void>
  fetchTag: (tag: string) => Promise<void>
  fetchSong: (id: string) => Promise<void>
  fetchSongs: (id: string[]) => Promise<void>

  tags: {
    [tag: string]: MiniSongType[]
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
  fetchTagTime: { [key: string]: number } = {}
  fetchTagListTime: number = 0
  fetchSongTime: { [key: string]: number } = {}

  state: Context = {
    fetchTag: (tag: string) => {
      if (typeof document === 'undefined') return Promise.resolve(undefined)
      if ((this.fetchTagTime[tag] || 0) + refetchAfter >= Date.now())
        return Promise.resolve(undefined)
      this.fetchTagTime[tag] = Date.now()
      return f
        .fetchTag({ id: tag })
        .then(v => {
          const value = v.tag
          if (value) {
            this.setState(st => ({
              tags: { ...st.tags, [tag]: value.songs },
            }))
          }
        })
        .catch(e => {
          console.info(e)
        })
        .then(() => {})
    },
    fetchTagList: () => {
      if (typeof document === 'undefined') return Promise.resolve(undefined)
      if (this.fetchTagListTime + refetchAfter >= Date.now())
        return Promise.resolve(undefined)
      this.fetchTagListTime = Date.now()
      return f
        .fetchTagList()
        .then(v => {
          this.setState({ tagList: v.tags })
        })
        .catch(e => {
          console.info(e)
        })
        .then(() => {})
    },
    fetchSong: (id: string) => {
      if (typeof document === 'undefined') return Promise.resolve(undefined)
      if ((this.fetchSongTime[id] || 0) + refetchAfter >= Date.now())
        return Promise.resolve(undefined)
      this.fetchSongTime[id] = Date.now()

      return f.fetchFullSong
        .load(id)
        .then(v => {
          if (v) {
            this.setState(st => ({
              songs: { ...st.songs, [id]: v },
            }))
          }
        })
        .catch(e => {
          console.info(e)
        })
        .then(() => {})
    },
    fetchSongs: (ids: string[]) => {
      if (typeof document === 'undefined') return Promise.resolve(undefined)
      const songs = ids.filter(
        id => (this.fetchSongTime[id] || 0) + refetchAfter < Date.now(),
      )
      if (songs.length <= 0) return Promise.resolve(undefined)

      songs.forEach(s => {
        this.fetchSongTime[s] = Date.now()
      })

      return f.fetchFullSong
        .loadMany(songs)
        .then(vs => {
          const val: { [id: string]: SongType } = {}
          let doSet: boolean = false
          vs.forEach((v, i) => {
            if (v) {
              doSet = true
              val[songs[i]] = v
            }
          })
          if (doSet) {
            this.setState(st => ({ songs: { ...st.songs, ...val } }))
          }
        })
        .catch(e => {
          console.info(e)
        })
        .then(() => {})
    },

    tagList: [],
    tags: {},
    songs: {},
  }

  componentDidMount() {
    this.state
      .fetchTagList()
      .then(() =>
        Promise.all(
          this.state.tagList
            .filter(t => t.id !== 'all')
            .map(t => this.state.fetchTag(t.id)),
        ),
      )
      .catch(() => {})

    this.state
      .fetchTag('all')
      .then(() =>
        Promise.all(this.state.tags.all.map(s => this.state.fetchSong(s.id))),
      )
      .catch(() => {})
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
  ctx.fetchTagList()
  return children(ctx.tagList)
})

export const SongsInTag = makeConsumer<{ tag: string }, MiniSongType[]>(
  (ctx, { children, tag }) => {
    ctx.fetchTag(tag)
    return children(ctx.tags[tag] || [])
  },
)

export const Song = makeConsumer<{ id: string }, SongType | null>(
  (ctx, { children, id }) => {
    ctx.fetchSong(id)
    return children(ctx.songs[id] || null)
  },
)

export const Songs = makeConsumer<{ ids: string[] }, SongType[]>(
  (ctx, { children, ids }) => {
    ctx.fetchSongs(ids)
    return children(ids.map(id => ctx.songs[id] || null).filter(a => a))
  },
)
