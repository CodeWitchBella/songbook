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
      textWithChords: content.substring(content.indexOf('\n\n') + 2),
    }
  })

const resolvers = {
  Query: {
    songs: () => ({
      total: songs.length,
      list: songs,
    }),
    song: (_: any, { id }: { id: string }) => songs.find(s => s.id === id),
  },
}
export default resolvers
