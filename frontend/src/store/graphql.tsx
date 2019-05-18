import { DateTime } from 'luxon'

const enableLocalhostBackend = false
const url =
  window.location.hostname === 'localhost' && enableLocalhostBackend
    ? 'http://localhost:8080/graphql'
    : 'https://europe-west2-songbook-240720.cloudfunctions.net/graphql'

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

export async function listSongs(): Promise<
  {
    id: string
    lastModified: DateTime
    slug: string
  }[]
> {
  return graphqlFetch({
    query: `
      {
        songs {
          id
          lastModified
          data { slug }
        }
      }
    `,
  }).then(v =>
    v.data.songs.map(mapLastModified).map((v: any) => ({
      id: v.id,
      lastModified: v.lastModified,
      slug: v.data.slug,
    })),
  )
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

export async function listSongsInitial(): Promise<FullSong[]> {
  return graphqlFetch({
    query: `
      {
        songs {
          ...fullSong
        }
      }
      ${fullSong}
    `,
  }).then(v => v.data.songs.map(mapFullSong))
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
