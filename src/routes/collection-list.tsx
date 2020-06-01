/** @jsx jsx */
import { jsx } from '@emotion/core'

import { errorBoundary } from 'containers/error-boundary'
import { InstallButtonLook } from 'components/install'
import { useCollectionList } from 'store/store'
import { useEffect } from 'react'
import { DateTime } from 'luxon'
import { BackButton, BackArrow } from 'components/back-button'
import { ListButton } from 'components/button'
import { View } from 'react-native'

let lastRefreshThisRefresh: DateTime | null = null

const CollectionList = () => {
  const { list, refresh } = useCollectionList()
  useEffect(() => {
    if (
      !lastRefreshThisRefresh ||
      lastRefreshThisRefresh.plus({ hours: 1 }) < DateTime.utc()
    ) {
      lastRefreshThisRefresh = DateTime.utc()
      refresh()
    }
  }, [refresh])
  return (
    <div css={{ minHeight: 'calc(100vh - 20px)', fontSize: 20, padding: 10 }}>
      <h2
        css={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BackButton css={{ display: 'flex', alignItems: 'center' }}>
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
          <ListButton
            to="/all-songs"
            style={{ borderWidth: 0 }}
            hoverStyle={{ textDecorationLine: 'underline' }}
          >
            Všechny písně
          </ListButton>
        </div>
        {list.map(({ item: collection }) => (
          <div key={collection.id}>
            <Gap />
            <ListButton
              to={`/collections/${collection.slug}`}
              style={{ borderWidth: 0 }}
            >
              {(collection.slug.includes('/')
                ? (collection.owner.handle || collection.owner.name) + ' > '
                : '') + collection.name}
            </ListButton>
          </div>
        ))}
      </View>
      <InstallButtonLook />
    </div>
  )
}
export default errorBoundary(CollectionList)

function Gap() {
  return <View style={{ height: 5 }} />
}
