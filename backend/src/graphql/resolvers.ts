import fs from 'fs'
import path from 'path'

const songDir = path.join(__dirname, '../../src/songs/')

const PRODUCTION = process.env.NODE_ENV === 'PRODUCTION'

const cacheInProd = <T extends Object>(load: () => T): (() => T) => {
  if (!PRODUCTION) return load
  const val = load()
  return () => val
}

const songs = cacheInProd(() =>
  fs
    .readdirSync(songDir)
    .map(fname => ({
      fname,
      content: fs.readFileSync(path.join(songDir, fname), 'utf-8'),
    }))
    .map(({ fname, content }) => {
      const lines = content.split('\n')
      return {
        id: fname.replace(/\.song$/, ''),
        author: lines[0],
        title: lines[1],
        tags: lines[2].split(',').filter(a => !!a),
        textWithChords: content.substring(content.indexOf('\n\n') + 2),
      }
    }),
)

const unique = () => {
  const found: string[] = []
  return (el: string) => {
    if (!found.includes(el)) {
      found.push(el)
      return true
    }
    return false
  }
}

const tags = cacheInProd(() => {
  const tagMap = JSON.parse(
    fs.readFileSync(path.join(songDir, 'tags.json'), 'utf-8'),
  )
  return songs()
    .map(s => s.tags)
    .reduce((p, c) => p.concat(c), [])
    .filter(unique())
    .concat('all')
    .sort()
    .map(tag => {
      const t = tagMap[tag]
      if (!t) return t
      return { id: tag, ...t }
    })
    .filter(a => !!a)
})

const resolvers = {
  Query: {
    songs: (_: any, { tag }: { tag: string }) => {
      const list = songs().filter(s => tag === 'all' || s.tags.includes(tag))
      return {
        total: list.length,
        list,
      }
    },
    tags,
    song: (_: any, { id }: { id: string }) => songs().find(s => s.id === id),
  },
}
export default resolvers
