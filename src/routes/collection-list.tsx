/** @jsxImportSource @emotion/react */

import { useCollectionList } from 'store/store'
import { useEffect } from 'react'
import { DateTime } from 'luxon'
import { BackButton, BackArrow } from 'components/back-button'
import { ListButton } from 'components/interactive/list-button'
import { View } from 'react-native'
import { useMemo } from 'react'
import { collectionCompare, collectionFullName } from 'utils/utils'
import { RootView, TH2 } from 'components/themed'

let lastRefreshThisRefresh: DateTime | null = null

export default function CollectionList() {
  const { list: unsortedList, refresh } = useCollectionList()
  useEffect(() => {
    if (
      !lastRefreshThisRefresh ||
      lastRefreshThisRefresh.plus({ hours: 1 }) < DateTime.utc()
    ) {
      lastRefreshThisRefresh = DateTime.utc()
      refresh()
    }
  }, [refresh])
  const sortedList = useMemo(
    () => [...unsortedList].sort(collectionCompare),
    [unsortedList],
  )
  return (
    <RootView style={{ padding: 10 }}>
      <TH2
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BackButton>
          <BackArrow />
        </BackButton>{' '}
        Seznam kolekcí
      </TH2>

      <View
        style={{
          flexDirection: 'column',
          marginHorizontal: 'auto',
        }}
      >
        <div>
          <ListButton to="/all-songs" style={{ borderWidth: 0 }}>
            Všechny písně
          </ListButton>
        </div>
        {sortedList.map(({ item: collection }) => (
          <div key={collection.id}>
            <Gap />
            <ListButton
              to={`/collections/${collection.slug}`}
              style={{ borderWidth: 0 }}
            >
              {collectionFullName(collection)}
            </ListButton>
          </div>
        ))}
      </View>
    </RootView>
  )
}

function Gap() {
  return <View style={{ height: 5 }} />
}
