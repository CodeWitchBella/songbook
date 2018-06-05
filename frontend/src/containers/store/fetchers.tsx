import DataLoader from 'dataloader'
import localForage from 'localforage'
import {
  fullSongs,
  fullSongsVariables,
  fullSongs_songs,
} from './__generated__/fullSongs'
import { tag, tagVariables } from './__generated__/tag'
import { tagList } from './__generated__/tagList'

const gql = ([a]: TemplateStringsArray) => a

type Querier<R, V> = V extends undefined
  ? (variables?: V) => Promise<R>
  : (variables: V) => Promise<R>

const query = <R, V = undefined>({
  q,
  opName,
  fallback,
  after,
}: {
  q: string
  opName: string
  after: V extends undefined
    ? (value: R) => Promise<R> | R
    : (value: R, variables: V) => Promise<R> | R
  fallback: V extends undefined
    ? () => Promise<R> | R
    : (variables: V) => Promise<R> | R
}): Querier<R, V> =>
  ((variables?: V): Promise<R> => {
    if (navigator.onLine) {
      return fetch('/graphql', {
        credentials: 'include',
        referrerPolicy: 'no-referrer-when-downgrade',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: q,
          variables: variables || null,
          opName,
        }),
        method: 'POST',
        mode: 'cors',
      })
        .then(r => r.json())
        .then(r => r.data)
        .then(value => (after as any)(value, variables))
        .catch(e => {
          console.info(e)
          return (fallback as any)(variables)
        })
    }
    return (fallback as any)(variables)
  }) as any

export const fetchTagList = query<tagList>({
  q: gql`
    query tagList {
      tags {
        id
        name
      }
    }
  `,
  opName: 'tagList',
  fallback() {
    return localForage.getItem('tagList') as Promise<tagList>
  },
  after(value) {
    return localForage.setItem('tagList', value).then(() => value)
  },
})

export const fetchTag = query<tag, tagVariables>({
  q: gql`
    query tag($id: ID!) {
      tag(id: $id) {
        songs {
          id
          title
          author
        }
      }
    }
  `,
  opName: 'tag',
  fallback(variables) {
    return localForage.getItem(`tag-${variables.id}`) as Promise<tag>
  },
  after(value, variables) {
    return localForage.setItem(`tag-${variables.id}`, value).then(() => value)
  },
})

export const fetchFullSongs = query<fullSongs, fullSongsVariables>({
  q: gql`
    query fullSongs($list: [ID!]!) {
      songs(list: $list) {
        id
        author
        title
        textWithChords
        metadata {
          audio
          fontSize
          paragraphSpace
          titleSpace
        }
      }
    }
  `,
  opName: 'songs',
  fallback(variables) {
    return Promise.all(
      variables.list.map(
        song => localForage.getItem(`song-${song}`) as Promise<fullSongs_songs>,
      ),
    ).then(songs => ({ songs }))
  },
  after(value) {
    return Promise.all<any>(
      value.songs.map(song => {
        if (song) return localForage.setItem(`song-${song.id}`, song)
        return null
      }),
    ).then(() => value)
  },
})

export const fetchFullSong = new DataLoader<string, fullSongs_songs | null>(
  keys => fetchFullSongs({ list: keys }).then(v => v.songs),
)
