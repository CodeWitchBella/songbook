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
