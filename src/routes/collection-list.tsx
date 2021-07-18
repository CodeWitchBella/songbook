/** @jsxImportSource @emotion/react */

import { useCollectionList } from 'store/store'
import { useEffect } from 'react'
import { DateTime } from 'luxon'
import { BackButton, BackArrow } from 'components/back-button'
import { ListButton } from 'components/interactive/list-button'
import { View } from 'react-native'
import { useMemo } from 'react'
import { collectionCompare, collectionFullName } from 'utils/utils'

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
    <div css={{ minHeight: 'calc(100vh - 20px)', fontSize: 20, padding: 10 }}>
      <h2
        css={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BackButton>
          <BackArrow />
        </BackButton>{' '}
        Seznam kolekcí
      </h2>

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
    </div>
  )
}

function Gap() {
  return <View style={{ height: 5 }} />
}
