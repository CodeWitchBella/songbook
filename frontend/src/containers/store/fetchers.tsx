import DataLoader from 'dataloader'
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
}: {
  q: string
  opName: string
}): Querier<R, V> =>
  ((variables?: V): Promise<R> =>
    fetch('/graphql', {
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
      .then(r => r.data)) as any

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
        }
      }
    }
  `,
  opName: 'songs',
})

export const fetchFullSong = new DataLoader<string, fullSongs_songs | null>(
  keys => fetchFullSongs({ list: keys }).then(v => v.songs),
)
