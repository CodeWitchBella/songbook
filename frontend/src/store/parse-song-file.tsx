export const parseSongFile = (fname: string, content: string) => {
  const del = content.indexOf('\n\n')
  const head = content.substring(0, del).split('\n')
  const text = content.substring(del + 2)
  return {
    id: fname.replace(/\.song$/, '').replace(/\./g, ''),
    author: head[0],
    title: head[1],
    tags: (head[2] || '').split(',').filter(a => !!a),
    metadata: JSON.parse(head[3] || '{}'),
    textWithChords: text,
  }
}
