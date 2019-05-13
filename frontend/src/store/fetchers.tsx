const enableLocalhostBackend = false
const url =
  window.location.hostname === 'localhost' && enableLocalhostBackend
    ? 'http://localhost:7071/api/graphql'
    : 'https://songbook-fn.azurewebsites.net/api/graphql'

function graphqlFetch(query: string, variables: any) {
  return fetch(url, {
    body: JSON.stringify({ operationName: null, query, variables }),
    method: 'POST',
  }).then(v => v.json())
}

export function newSong(song: {
  author: string
  title: string
}): Promise<string> {
  return graphqlFetch(
    `
    mutation($input: CreateSongInput!) {
      createSong(input: $input)
    }
  `,
    { input: { author: song.author, title: song.title } },
  ).then(v =>
    v && v.data && v.data.createSong
      ? v.data.createSong.replace(/\.song$/, '')
      : null,
  )
}

function pick(v: { [key: string]: any }, keys: string[]): any {
  const ret: any = {}
  for (const k of keys) {
    if (k in v) ret[k] = v[k]
  }
  return ret
}

export function writeSong(song: {
  id: string
  title: string
  author: string
  textWithChords: string
  metadata: {
    fontSize?: number
    paragraphSpace?: number
    titleSpace?: number
    spotify?: string
  }
}) {
  return graphqlFetch(
    `
    mutation($input: WriteSongInput!) {
      writeSong(input: $input) {
        id
        textWithChords
      }
    }
  `,
    {
      input: {
        ...pick(song, ['title', 'author', 'textWithChords']),
        metadata: pick(song.metadata, [
          'fontSize',
          'paragraphSpace',
          'titleSpace',
          'spotify',
        ]),
        id: song.id + '.song',
      },
    },
  )
}
export function useTag() {
  if (false) return null
  return { cover: '' }
}
export function useTags() {
  return []
}
