/** @jsxImportSource @emotion/react */

import SongList from 'sections/song-list/song-list'
import { useCollection, usePagesNum } from 'store/store'
import { useMemo, useCallback, useEffect } from 'react'
import { Text, View, StyleSheet } from 'react-native'

const emptyArray: never[] = []
function useColectionWithSet(slug: string) {
  const { collection } = useCollection({ slug })
  const songList = collection ? collection.songList : emptyArray
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
        menu={<Stats set={set} songCount={collection.songList.length} />}
      />
    </div>
  )
}

function Stats({
  set,
  songCount,
}: {
  set: Set<string> | undefined
  songCount: number
}) {
  const pagesNum = usePagesNum(set || null)
  return (
    <View style={styles.stat}>
      <Text style={styles.statItem}>
        {pagesNum} stran a {songCount} písní
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  stat: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
  },
  statItem: {
    fontSize: 18,
  },
})
