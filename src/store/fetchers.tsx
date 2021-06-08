import { getGraphqlUrl, graphqlFetch } from './graphql'

async function jsonPost(path: string, json: any) {
  const res = await fetch(new URL(path, getGraphqlUrl()).toString(), {
    body: JSON.stringify(json),
    method: 'post',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
  })
  return {
    data:
      res.headers.get('content-type')?.split(';')[0].trim() ===
      'application/json'
        ? await res.json()
        : await res.text(),
    success: res.status === 200,
  }
}

export function newSong(song: {
  author: string
  title: string
  text?: string
  extraNonSearchable?: string
}): Promise<{ slug: string }> {
  return jsonPost('/api/song', song).then((v) => {
    if (v?.data?.slug) return v.data
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
    pretranspose: number | null
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
          'pretranspose',
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
