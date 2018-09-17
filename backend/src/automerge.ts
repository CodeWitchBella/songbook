import AutomergeServer from 'automerge-server'
import fs from 'fs'
import path from 'path'
import Automerge from 'automerge'
import { promisify } from 'util'
import { songDir, songs } from './graphql/resolvers'
import Mutation from './graphql/mutations'

const loaders: { [key: string]: (id: string) => Promise<any> } = {
  async song(id) {
    if (!/^[0-9a-z_-]+$/i.exec(id)) return false
    try {
      return await promisify(fs.readFile)(
        path.join(songDir, `${id}.automerge`),
        'utf8',
      )
    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.error(e)
        return false
      }
    }
    const song = songs.get().find(s => s.id === id)
    if (!song) return false

    return Automerge.change(Automerge.init(), (doc_: any) => {
      const doc = doc_
      doc.id = song.id

      doc.author = new Automerge.Text()
      doc.author.insertAt(0, ...song.author.split(''))
      doc.title = new Automerge.Text()
      doc.title.insertAt(0, ...song.title.split(''))
      doc.textWithChords = new Automerge.Text()
      doc.textWithChords.insertAt(0, ...song.textWithChords.split(''))

      doc.metadata = song.metadata
      doc.tags = song.tags
    })
  },
}

function textToString(text: any) {
  let ret = ''
  for (const ch of text) {
    ret += ch
  }
  return ret
}

function stringArray(arr: any) {
  if (!Array.isArray(arr)) return undefined
  return arr.map(e => `${e}`)
}

function coerceNumber(d: number) {
  if (Number.isFinite(d)) return d
  return undefined
}

const savers: {
  [key: string]: (id: string, text: string, doc: any) => void | Promise<void>
} = {
  async song(id, text, doc) {
    if (!/^[0-9a-z_-]+$/i.exec(id)) return
    await promisify(fs.writeFile)(
      path.join(songDir, `${id}.automerge`),
      text,
      'utf8',
    )
    console.log(doc.metadata)
    await Mutation.editSong(
      {},
      {
        song: {
          id,
          author: textToString(doc.author),
          title: textToString(doc.title),
          textWithChords: textToString(doc.textWithChords),
          tags: stringArray(doc.tags),
          metadata: {
            audio: `${doc.metadata.audio}`,
            fontSize: coerceNumber(doc.metadata.fontSize),
            paragraphSpace: coerceNumber(doc.metadata.paragraphSpace),
            titleSpace: coerceNumber(doc.metadata.titleSpace),
          },
        },
      },
    )
  },
}

export default new AutomergeServer({
  loadDocument: (id: string) => {
    const parts = id.split('/')
    if (parts.length !== 2) return Promise.resolve(false)

    const loader = loaders[parts[0]]
    if (!loader) return Promise.resolve(false)
    return loader(parts[1])
  },
  saveDocument: (id: string, text: string, doc: any) => {
    const parts = id.split('/')
    if (parts.length !== 2) return Promise.resolve(false)

    const saver = savers[parts[0]]
    if (!saver) return Promise.resolve(false)
    return saver(parts[1], text, doc)
  },
})
