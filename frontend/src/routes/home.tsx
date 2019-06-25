/** @jsx jsx */
import { jsx } from '@emotion/core'
import SongList from 'sections/song-list/song-list'
import { errorBoundary } from 'containers/error-boundary'
import { InstallButtonLook } from 'components/install'

const Home = () => (
  <div css={{ height: '100%' }}>
    <SongList slug={null} title={null} />
    <InstallButtonLook />
  </div>
)
export default errorBoundary(Home)
