/** @jsx jsx */
import { jsx } from '@emotion/react'
import SongList from 'sections/song-list/song-list'
import { errorBoundary } from 'containers/error-boundary'

const Home = () => (
  <div css={{ height: '100%' }}>
    <SongList slug={null} title={null} />
  </div>
)
export default errorBoundary(Home)
