/** @jsx jsx */
import { jsx } from '@emotion/core'
import SongList from '../sections/song-list/song-list'
import { ErrorBoundary } from '../containers/error-boundary'

const Home = () => (
  <ErrorBoundary>
    <div css={{ height: '100%' }}>
      <SongList slug={null} title={null} />
    </div>
  </ErrorBoundary>
)
export default Home
