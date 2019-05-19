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

const fullSong = `
  fragment fullSong on SongRecord {
    id
    lastModified
    data { slug }
    shortData: data {
      author
      title
    }
    longData: data {
      text
      fontSize
      paragraphSpace
      titleSpace
      spotify
    }
  }
`
type FullSong = {
  id: string
  lastModified: DateTime
  slug: string
  shortData: {
    author: string
    title: string
  }
  longData: {
    text: string
    fontSize: number | null
    paragraphSpace: number | null
    titleSpace: number | null
    spotify: string | null
  }
}

function mapLastModified(s: any) {
  return {
    ...s,
    lastModified: DateTime.fromISO(s.lastModified),
  }
}

export type Viewer = {
  name: string
  picture: {
    url: string
    width: number
    height: number
  }
}

const viewerFragment = `
  fragment viewer on User {
    name
    picture {
      url
      width
      height
    }
  }
`

export async function onLoadQuery(): Promise<{
  songs: {
    id: string
    lastModified: DateTime
    slug: string
  }[]
  viewer: null | Viewer
}> {
  return graphqlFetch({
    query: `
      {
        songs {
          id
          lastModified
          data { slug }
        }
        viewer {
          ...viewer
        }
      }
      ${viewerFragment}
    `,
  }).then(v => ({
    songs: v.data.songs.map(mapLastModified).map((v: any) => ({
      id: v.id,
      lastModified: v.lastModified,
      slug: v.data.slug,
    })),
    viewer: v.data.viewer,
  }))
}

function mapFullSong(data: any) {
  const v = mapLastModified(data)
  return {
    id: v.id,
    lastModified: v.lastModified,
    longData: v.longData,
    shortData: v.shortData,
    slug: v.data.slug,
  }
}

export async function onLoadQueryInitial(): Promise<{
  songs: FullSong[]
  viewer: null
}> {
  return graphqlFetch({
    query: `
      {
        songs {
          ...fullSong
        }
      }
      ${fullSong}
    `,
  }).then(v => ({ songs: v.data.songs.map(mapFullSong), viewer: null }))
}

export async function downloadSongsBySlugs(
  slugs: string[],
): Promise<FullSong[]> {
  return graphqlFetch({
    query: `
      query($slugs: [String!]!) {
        songsBySlugs(slugs: $slugs) {
          ...fullSong
        }
      }
      ${fullSong}
    `,
    variables: { slugs },
  }).then(v => v.data.songsBySlugs.map(mapFullSong))
}

export async function downloadSongsByIds(ids: string[]): Promise<FullSong[]> {
  if (ids.some(id => !id)) throw new Error('Invalid ids')
  return graphqlFetch({
    query: `
      query($ids: [String!]!) {
        songsByIds(ids: $ids) {
          ...fullSong
        }
      }
      ${fullSong}
    `,
    variables: { ids },
  }).then(v => v.data.songsByIds.map(mapFullSong))
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
): Promise<Viewer> {
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
              ...viewer
            }
          }
        }
      }
      ${viewerFragment}
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
