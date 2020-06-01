/** @jsx jsx */
/** @jsxFrag React.Fragment */
import { jsx } from '@emotion/core'
import SongList from 'sections/song-list/song-list'
import { errorBoundary } from 'containers/error-boundary'
import { InstallButtonLook } from 'components/install'
import { useCollection } from 'store/store'
import { useMemo, useCallback } from 'react'
import { BackButton, BackArrow } from 'components/back-button'

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

const Collection = ({ slug }: { slug: string }) => {
  const collection = useColectionWithSet(slug)
  const set = collection?.set
  const filter = useCallback((id) => (set && set?.has(id)) || false, [set])
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
        filter={filter}
        header={
          <>
            <BackButton to="/collections" css={{ fontSize: 'inherit' }}>
              <BackArrow />
            </BackButton>
            {(collection.slug.includes('/')
              ? (collection.owner.handle || collection.owner.name) + ' > '
              : '') + collection.name}
          </>
        }
        slug={collection.slug}
        title={collection.name}
      />
      <InstallButtonLook />
    </div>
  )
}
export default errorBoundary(Collection)
