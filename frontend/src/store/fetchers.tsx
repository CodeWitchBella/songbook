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

export function newSong(song: any): Promise<{ newSong: string }> {
  throw new Error('Not implemented')
}
export function writeSong(song: any) {
  return graphqlFetch(
    `
    mutation($input: WriteSongInput!) {
      writeSong(input: $input) {
        id
        textWithChords
      }
    }
  `,
    { input: { ...song, id: song.id + '.song' } },
  )
}
export function useTag() {
  if (false) return null
  return { cover: '' }
}
export function useTags() {
  return []
}
