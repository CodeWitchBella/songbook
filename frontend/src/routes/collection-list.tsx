/** @jsx jsx */
import { jsx } from '@emotion/core'

import { errorBoundary } from 'containers/error-boundary'
import { InstallButtonLook } from 'components/install'
import { useCollectionList } from 'store/store'
import { Link, withRouter, RouteComponentProps } from 'react-router-dom'
import { PropsWithChildren } from 'react'

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

const CollectionList = () => {
  const { list } = useCollectionList()
  console.log(list)
  return (
    <div css={{ height: '100%', fontSize: 20, padding: 10 }}>
      <h2>
        <BackButton>Zpět</BackButton> Seznam kolekcí
      </h2>

      <div>
        {list.map(item => (
          <Link to={`/collections/${item.item.slug}`}>{item.item.slug}</Link>
        ))}
      </div>
      <InstallButtonLook />
    </div>
  )
}
export default errorBoundary(CollectionList)
