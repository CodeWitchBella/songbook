export function parseTextSongFile(fname: string, content: string) {
  const del = content.indexOf('\n\n')
  const head = content.substring(0, del).split('\n')
  const text = content.substring(del + 2)
  return {
    id: fname.replace(/\.song$/, '').replace(/\./g, ''),
    author: head[0],
    title: head[1],
    metadata: JSON.parse(head[3] || '{}'),
    textWithChords: text,
  }
}

export const parseSongFile = (
  fname: string,
  content: string,
): ReturnType<typeof parseTextSongFile> => {
  if (content[0] === '{') {
    const parsed = JSON.parse(content)
    return {
      author: '',
      title: '',
      metadata: {},
      textWithChords: '',
      ...parsed,
      id: fname.replace(/\.song$/, '').replace(/\./g, ''),
    }
  }
  return parseTextSongFile(fname, content)
}
export type Song = ReturnType<typeof parseSongFile>
