import { everything } from './__generated__/everything'
import * as n from './__generated__/newSong'
import * as e from './__generated__/editSong'

const gql = ([a]: TemplateStringsArray) => a

type Querier<R, V> = V extends undefined
  ? (variables?: V) => Promise<R | null>
  : (variables: V) => Promise<R | null>

const query = <R, V = undefined>({
  q,
  opName,
}: {
  q: string
  opName: string
}): Querier<R, V> =>
  ((variables?: V): Promise<R | null> => {
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
    }
    return Promise.resolve(null)
  }) as any

export const fetchEverything = query<everything>({
  q: gql`
    query everything {
      tags {
        id
        name
        songs {
          id
        }
      }
      songs: allSongs {
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
        tags {
          id
        }
      }
    }
  `,
  opName: 'everything',
})

export const newSong = query<n.newSong, n.newSongVariables>({
  q: gql`
    mutation newSong($song: NewSongInput!) {
      newSong(song: $song)
    }
  `,
  opName: 'newSong',
})

export const editSong = query<e.editSong, e.editSongVariables>({
  q: gql`
    mutation editSong($song: EditSongInput!) {
      editSong(song: $song)
    }
  `,
  opName: 'editSong',
})
