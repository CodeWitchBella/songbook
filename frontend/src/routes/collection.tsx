/** @jsxImportSource @emotion/react */

import { TText } from 'components/themed'
import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { useParams } from 'react-router'
import SongList from 'sections/song-list/song-list'
import { useCollection, usePagesNum } from 'store/store'

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

export default function Collection() {
  const params = useParams()
  const slug = params.slug + (params.slug2 ? '/' + params.slug2 : '')
  console.log(slug)
  const collection = useColectionWithSet(slug)
  const set = collection?.set
  const filter = useCallback((id: string) => set?.has(id) || false, [set])

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
          <View style={{ paddingTop: 12 }}>
            <TText
              style={{ fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}
            >
              {(collection.slug.includes('/')
                ? (collection.owner.handle || collection.owner.name) + ' > '
                : '') + collection.name}
            </TText>
          </View>
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
  const { t } = useTranslation()
  return (
    <View style={styles.stat}>
      <TText style={styles.statItem}>
        {t('count-pages-songs', { pagesNum, songCount })}
      </TText>
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
