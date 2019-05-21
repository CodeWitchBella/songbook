import { DateTime } from 'luxon'

const enableLocalhostBackend = false
const url =
  window.location.hostname === 'localhost' && enableLocalhostBackend
    ? 'http://localhost:8080/graphql'
    : 'https://europe-west1-songbook-240720.cloudfunctions.net/graphql'

export function getGraphqlUrl() {
  return url
}

let promise = Promise.resolve(null as any)
export function graphqlFetch<V = any>({
  query,
  variables,
}: {
  query: string
  variables?: V
}) {
  const tmpe = new Error()
  const p = promise
    .catch(() => {})
    .then(async () => {
      const req = await fetch(url, {
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          operationName: null,
          variables,
          query,
        }),
        method: 'POST',
      })
      const json = await req.json()
      if (json.errors) {
        const error = new Error('Network error: Graphql request failed')
        ;(error as any).data = json
        error.stack = tmpe.stack
        throw error
      }
      return json
    })
  promise = p
  return p
}

export type User = {
  name: string
  picture: {
    url: string
    width: number
    height: number
  }
}

const userFragment = `
  fragment user on User {
    name
    picture {
      url
      width
      height
    }
  }
`

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
  editor: User | null
  insertedAt: DateTime | null
}

export async function onLoadQuery(
  modifiedAfter?: DateTime,
): Promise<{
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
  }).then(v => ({
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
    spotify?: string
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
  }).then(v => {
    if (!v.data.updateSong) throw new Error('updateSong failed')
  })
}

export async function fbLogin(
  code: string,
  redirectUri: string,
): Promise<User> {
  return graphqlFetch({
    query: `
      mutation($code: String!, $redirectUri: String!) {
        fbLogin(code: $code, redirectUri: $redirectUri) {
          __typename
          ... on LoginError {
            message
          }
          ... on LoginSuccess {
            user {
              ...user
            }
          }
        }
      }
      ${userFragment}
    `,
    variables: { code, redirectUri },
  }).then(v => {
    if (v.data.fbLogin.__typename !== 'LoginSuccess') {
      console.log(v.data.fbLogin)
      throw new Error('Login failed')
    }
    return v.data.fbLogin.user
  })
}

export async function logout(): Promise<void> {
  return graphqlFetch({
    query: `mutation { logout }`,
  }).then(v => {
    if (!v.data.logout) {
      console.log(v.data.logout)
      throw new Error('Login failed')
    }
    return v.data.logout
  })
}
