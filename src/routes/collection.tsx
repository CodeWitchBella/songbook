/** @jsx jsx */
/** @jsxFrag React.Fragment */
import { jsx } from '@emotion/core'
import SongList from '../sections/song-list/song-list'
import { useCollection } from '../store/store'
import { useMemo, useCallback, useEffect } from 'react'

function useColectionWithSet(slug: string) {
  const { collection } = useCollection({ slug })
  const songList = collection ? collection.songList : []
  const set = useMemo(() => {
    const v = new Set<string>()
    for (const id of songList) v.add(id)
    return v
  }, [songList])
  if (!collection) return null
  return { set, ...collection }
}

export default function Collection({ slug }: { slug: string }) {
  const collection = useColectionWithSet(slug)
  const set = collection?.set
  const filter = useCallback((id) => (set && set?.has(id)) || false, [set])

  const collectionId = collection?.id
  useEffect(() => {
    if (collectionId) console.log('Collection id:', collectionId)
  }, [collectionId])
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
  return (
    <div css={{ height: '100%' }}>
      <SongList
        filter={filter}
        header={
          <>
            {(collection.slug.includes('/')
              ? (collection.owner.handle || collection.owner.name) + ' > '
              : '') + collection.name}
          </>
        }
        slug={collection.slug}
        title={collection.name}
      />
    </div>
  )
}
