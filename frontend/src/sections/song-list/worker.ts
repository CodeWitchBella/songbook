import type { SearchableSong } from './alg'
import getFilteredSongList from './alg'

let songs: SearchableSong[] = []
let search = ''

function onlyCallLast(f: () => void) {
  let calculating = false
  let shouldRecalculate: false | string = false
  const result = () => {
    if (calculating) {
      shouldRecalculate = origin
      return
    }
    shouldRecalculate = false
    calculating = true
    f()
    if (shouldRecalculate === false) {
      calculating = false
    } else {
      Promise.resolve().then(() => {
        calculating = false
        if (shouldRecalculate) result()
      })
    }
  }
  return result
}

const recalculate = onlyCallLast(() => {
  ;(postMessage as any)({
    type: 'setList',
    value: {
      search,
      sourceListLength: songs.length,
      list: getFilteredSongList(songs, search),
    },
  })
})

onmessage = function (evt) {
  const { type, value } = evt.data
  if (type === 'setSongs') {
    songs = value
    recalculate()
  } else if (type === 'setSearch') {
    search = value
    recalculate()
  } else {
    console.warn('Unknown message type ' + type)
  }
}
