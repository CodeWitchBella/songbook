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
  fetchTagList: () => void
  fetchTag: (tag: string) => void
  fetchSong: (id: string) => void
  fetchSongs: (id: string[]) => void

  tags: {
    [tag: string]: MiniSongType[]
  }

  songs: {
    [id: string]: SongType
  }
}

const context = createContext(null as null | Context)

const refetchAfter = 1000 * 60 * 60

export class StoreProvider extends React.Component<{}, Context> {
  fetchTagTime: { [key: string]: number } = {}
  fetchTagListTime: number = 0
  fetchSongTime: { [key: string]: number } = {}

  state: Context = {
    fetchTag: (tag: string) => {
      if ((this.fetchTagTime[tag] || 0) + refetchAfter >= Date.now()) return
      this.fetchTagTime[tag] = Date.now()
      f.fetchTag({ id: tag })
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
    },
    fetchTagList: () => {
      if (this.fetchTagListTime + refetchAfter >= Date.now()) return
      this.fetchTagListTime = Date.now()
      f.fetchTagList()
        .then(v => {
          this.setState({ tagList: v.tags })
        })
        .catch(e => {
          console.info(e)
        })
    },
    fetchSong: (id: string) => {
      if ((this.fetchSongTime[id] || 0) + refetchAfter >= Date.now()) return
      this.fetchSongTime[id] = Date.now()

      f.fetchFullSong
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
    },
    fetchSongs: (ids: string[]) => {
      const songs = ids.filter(
        id => (this.fetchSongTime[id] || 0) + refetchAfter < Date.now(),
      )
      console.log('fetchSongs', ids, songs)
      if (songs.length <= 0) return

      songs.forEach(s => {
        this.fetchSongTime[s] = Date.now()
      })

      f.fetchFullSong
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
    },

    tagList: [],
    tags: {},
    songs: {},
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
