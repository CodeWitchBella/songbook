/** @jsx jsx */
import { jsx } from '@emotion/core'
import SongList from 'sections/song-list/song-list'
import { SaveScroll } from 'components/scroll'
import { errorBoundary } from 'containers/error-boundary'
import { InstallButtonLook } from 'components/install'

const Home = () => (
  <div css={{ height: '100%' }}>
    <SaveScroll />
    <SongList tag="all" />
    <InstallButtonLook />
  </div>
)
export default errorBoundary(Home)
