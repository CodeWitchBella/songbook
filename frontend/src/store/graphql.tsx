import { DateTime } from 'luxon'

const enableLocalhostBackend = false
const url =
  window.location.hostname === 'localhost' && enableLocalhostBackend
    ? 'http://localhost:8080/graphql'
    : 'https://zpevnik.skorepova.info/graphql'

let promise = Promise.resolve(null as any)
export function graphqlFetch<V = any>({
  query,
  variables,
}: {
  query: string
  variables?: V
}) {
  promise = promise.then(async () => {
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
      throw error
    }
    return json
  })
  return promise
}

const fullSong = `
  fragment fullSong on SongRecord {
    id
    lastModified
    shortData: data {
      slug
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
  shortData: {
    slug: string
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
    shortData: {
      slug: string
      author: string
      title: string
    }
  }[]
> {
  return graphqlFetch({
    query: `
      {
        songs {
          id
          lastModified
          shortData: data {
            slug
            author
            title
          }
        }
      }
    `,
  }).then(v => v.data.songs.map(mapLastModified))
}

export async function listSongsInitial() {
  return graphqlFetch({
    query: `
      {
        songs {
          ...fullSong
        }
      }
      ${fullSong}
    `,
  }).then(v => v.data.songs.map(mapLastModified))
}

export async function downloadSongs(slugs: string[]): Promise<FullSong[]> {
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
  }).then(v => v.data.songsBySlugs.map(mapLastModified))
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
  })
}
