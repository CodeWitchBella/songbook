import getFilteredSongList from './alg'
import { Song } from 'store/store'

let songs: Song[] = []
let search = ''

declare var self: any

function recalculate(origin: string) {
  ;(postMessage as any)({
    type: 'setList',
    value: {
      search,
      list: getFilteredSongList(songs, search),
    },
  })
}

onmessage = function(evt) {
  const { type, value } = evt.data
  const { origin } = evt
  if (type === 'setSongs') {
    songs = value
    recalculate(origin)
  } else if (type === 'setSearch') {
    search = value
    recalculate(origin)
  } else {
    console.warn('Unknown message type ' + type)
  }
}
