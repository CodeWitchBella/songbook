/** @jsx jsx */
import { jsx } from '@emotion/core'

import { errorBoundary } from 'containers/error-boundary'
import { InstallButtonLook } from 'components/install'
import { useCollectionList } from 'store/store'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { DateTime } from 'luxon'
import { BackButton, BackArrow } from 'components/back-button'

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
    <div css={{ height: '100%', fontSize: 20, padding: 10 }}>
      <h2 css={{ display: 'flex', alignItems: 'center' }}>
        <BackButton css={{ display: 'flex', alignItems: 'center' }}>
          <BackArrow />
        </BackButton>{' '}
        Seznam kolekcí
      </h2>

      <div>
        <div>
          <Link to={{ pathname: '/', state: { canGoBack: true } }}>
            Všechny písně
          </Link>
        </div>
        {list.map(({ item: collection }) => (
          <div key={collection.id}>
            <Link
              to={{
                pathname: `/collections/${collection.slug}`,
                state: { canGoBack: true },
              }}
            >
              {(collection.slug.includes('/')
                ? (collection.owner.handle || collection.owner.name) + ' > '
                : '') + collection.name}
            </Link>
          </div>
        ))}
      </div>
      <InstallButtonLook />
    </div>
  )
}
export default errorBoundary(CollectionList)
