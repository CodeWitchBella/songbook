import getFilteredSongList, { SearchableSong } from './alg'

let songs: SearchableSong[] = []
let search = ''

function onlyCallLast(f: (arg: string) => void) {
  let calculating = false
  let shouldRecalculate: false | string = false
  return (arg: string) => {
    if (calculating) {
      shouldRecalculate = origin
      return
    }
    shouldRecalculate = false
    calculating = true
    f(arg)
    if (shouldRecalculate === false) {
      calculating = false
    } else {
      setImmediate(() => {
        calculating = false
        if (shouldRecalculate) recalculate(shouldRecalculate)
      })
    }
  }
}

const recalculate = onlyCallLast((origin: string) => {
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
