/** @jsx jsx */
import { jsx } from '@emotion/core'
import SongList from 'sections/song-list/song-list'
import { errorBoundary } from 'containers/error-boundary'
import { InstallButtonLook } from 'components/install'
import { useCollection } from 'store/store'
import { useMemo } from 'react'

const Collection = ({ slug }: { slug: string }) => {
  const { collection } = useCollection({ slug })
  const songList = collection ? collection.songList : []
  const set = useMemo(() => {
    const v = new Set<string>()
    for (const id of songList) v.add(id)
    return v
  }, [songList])
  if (!collection)
    return (
      <div
        css={{
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        Kolekce se načítá nebo neexistuje
      </div>
    )
  console.log('Collection id:', collection.id)
  return (
    <div css={{ height: '100%' }}>
      <SongList
        filter={id => set.has(id)}
        header={
          (collection.slug.includes('/')
            ? (collection.owner.handle || collection.owner.name) + ' > '
            : '') + collection.name
        }
      />
      <InstallButtonLook />
    </div>
  )
}
export default errorBoundary(Collection)
