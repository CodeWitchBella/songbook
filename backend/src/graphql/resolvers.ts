import fs from 'fs'
import path from 'path'

const songDir = path.join(__dirname, '../../src/songs/')
const songs = fs
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
  })

const resolvers = {
  Query: {
    songs: (_: any, { tag }: { tag: string }) => {
      const list = songs.filter(s => tag === 'all' || s.tags.includes(tag))
      return {
        total: list.length,
        list,
      }
    },
    song: (_: any, { id }: { id: string }) => songs.find(s => s.id === id),
  },
}
export default resolvers
