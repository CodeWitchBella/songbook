import { graphqlFetch } from './graphql'

export function newSong(song: {
  author: string
  title: string
}): Promise<{ slug: string; id: string }> {
  return graphqlFetch({
    query: `
      mutation($input: CreateSongInput!) {
        createSong(input: $input) { id data{slug} }
      }
    `,
    variables: { input: { author: song.author, title: song.title } },
  }).then((v) => {
    if (v && v.data && v.data.createSong)
      return { slug: v.data.createSong.data.slug, id: v.data.createSong.id }
    throw new Error('New song failed')
  })
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
    fontSize: number | null
    paragraphSpace: number | null
    titleSpace: number | null
    spotify: string | null
  }
}) {
  return graphqlFetch({
    query: `
      mutation($input: WriteSongInput!) {
        writeSong(input: $input) {
          id
          textWithChords
        }
      }
    `,
    variables: {
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
  })
}
export function useTag() {
  if (false) return null
  return { cover: '' }
}
export function useTags() {
  return []
}
