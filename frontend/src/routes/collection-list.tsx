/** @jsx jsx */
import { jsx } from '@emotion/core'

import { errorBoundary } from 'containers/error-boundary'
import { InstallButtonLook } from 'components/install'
import { useCollectionList } from 'store/store'
import { Link, withRouter, RouteComponentProps } from 'react-router-dom'
import { PropsWithChildren, useEffect } from 'react'
import { DateTime } from 'luxon'

function BackButtonImpl({
  children,
  location,
  history,
}: PropsWithChildren<RouteComponentProps<any>>) {
  return (
    <button
      css={{
        all: 'unset',
        display: 'inline-block',
        color: 'darkblue',
        marginRight: '10px',
        textDecoration: 'underline',
        ':hover': {
          fontWeight: 'bold',
          textDecoration: 'none',
        },
        fontSize: 25,
      }}
      type="button"
      onClick={() => {
        if (location.state && location.state.canGoBack) history.goBack()
        else history.push('/')
      }}
    >
      {children}
    </button>
  )
}
const BackButton = withRouter(BackButtonImpl)

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
      <h2>
        <BackButton>Zpět</BackButton> Seznam kolekcí
      </h2>

      <div>
        <div>
          <Link to="/">Všechny písně</Link>
        </div>
        {list.map(({ item: collection }) => (
          <div key={collection.id}>
            <Link to={`/collections/${collection.slug}`}>
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
