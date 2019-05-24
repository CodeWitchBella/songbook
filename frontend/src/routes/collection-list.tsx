/** @jsx jsx */
import { jsx } from '@emotion/core'

import { errorBoundary } from 'containers/error-boundary'
import { InstallButtonLook } from 'components/install'

const CollectionList = () => (
  <div css={{ height: '100%' }}>
    <div>Seznam kolekcí...</div>
    <InstallButtonLook />
  </div>
)
export default errorBoundary(CollectionList)
