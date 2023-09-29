import { DateTime } from 'luxon'

import { GenericStore } from './generic-store'
import type { User } from './graphql'
import { graphqlFetch, userFragment } from './graphql'

const songRecordFragment = `
  fragment songRecord on SongRecord {
    id
    lastModified
    data {
      slug
      author
      title
      text
      fontSize
      paragraphSpace
      titleSpace
      spotify
      pretranspose
      extraSearchable
      extraNonSearchable
      editor {
        ...user
      }
      insertedAt
    }
  }
  ${userFragment}
`
type SongRecord = {
  id: string
  lastModified: DateTime

  slug: string
  author: string
  title: string
  text: string
  fontSize: number
  paragraphSpace: number
  titleSpace: number
  spotify: string | null
  pretranspose: number
  extraSearchable: string | null
  extraNonSearchable: string | null
  editor: User | null
  insertedAt: DateTime | null
}

export async function onLoadQuery(modifiedAfter?: DateTime): Promise<{
  songs: SongRecord[]
  viewer: User | null
  deletedSongs: { id: string }[]
}> {
  return graphqlFetch({
    query: `
      query($modifiedAfter: String, $deletedAfter: String!, $skipDeleted: Boolean!) {
        songs(modifiedAfter: $modifiedAfter) {
          ...songRecord
        }
        viewer {
          ...user
        }
        deletedSongs(deletedAfter: $deletedAfter) @skip(if: $skipDeleted)
      }
      ${songRecordFragment}
    `,
    variables: {
      modifiedAfter: modifiedAfter ? modifiedAfter.toISO() : null,
      deletedAfter: modifiedAfter
        ? modifiedAfter.toISO()
        : DateTime.utc().toISO(),
      skipDeleted: !modifiedAfter,
    },
  }).then((v) => ({
    songs: v.data.songs.map((s: any) => ({
      ...s.data,
      id: s.id,
      lastModified: DateTime.fromISO(s.lastModified),
      insertedAt: s.data.insertedAt
        ? DateTime.fromISO(s.data.insertedAt)
        : null,
    })),
    viewer: v.data.viewer,
    deletedSongs: (v.data.deletedSongs || []).map((id: string) => ({ id })),
  }))
}

export async function updateSong(
  id: string,
  input: {
    slug?: string
    author?: string
    title?: string
    text?: string
    fontSize?: number
    paragraphSpace?: number
    titleSpace?: number
    extraSearchable?: string
    extraNonSearchable?: string
    spotify?: string
    pretranspose?: number
  },
) {
  return graphqlFetch({
    query: `
    mutation($id: String!, $input: UpdateSongInput!) {
      updateSong(id: $id, input: $input) {
        id
      }
    }
    
    `,
    variables: { id, input },
  }).then((v) => {
    if (!v.data.updateSong) throw new Error('updateSong failed')
  })
}

type Song<DT> = {
  slug: string
  id: string
  lastModified: DT
  text: string
  fontSize: number
  paragraphSpace: number
  titleSpace: number
  spotify: string | null
  pretranspose: number
  editor: User | null
  insertedAt: DT | null
  author: string
  title: string
  extraSearchable: string | null
  extraNonSearchable: string | null
}

export type SongType = Song<DateTime>

export function createSongStore({
  setIniting,
  setViewer,
  setLoading,
}: {
  setIniting: (v: boolean) => void
  setLoading: (v: boolean) => void
  setViewer: (viewer: User | null) => void
}) {
  return new GenericStore<SongType, Song<string>>({
    cacheKey: 'songs',
    serialize: (item) => {
      return {
        ...item,
        lastModified: item.lastModified.toISO(),
        insertedAt: item.insertedAt ? item.insertedAt.toISO() : null,
      }
    },
    deserialize: (item) => {
      return {
        ...item,
        lastModified: DateTime.fromISO(item.lastModified),
        insertedAt: item.insertedAt ? DateTime.fromISO(item.insertedAt) : null,
      }
    },
    loadIncremental: (after) =>
      onLoadQuery(after).then((v) => {
        setViewer(v.viewer)
        return { changed: v.songs, deleted: v.deletedSongs }
      }),
    loadInitial: () =>
      onLoadQuery().then((v) => {
        setViewer(v.viewer)
        return v.songs
      }),
    onLoadedFromCache: () => setIniting(false),
    onLoadingChange: (v) => setLoading(v),
  })
}
