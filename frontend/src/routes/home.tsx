import React from 'react'
import { hot } from 'react-hot-loader'
import SongList from 'sections/song-list/song-list'

const Home = () => (
  <div>
    <SongList />
  </div>
)
export default hot(module)(Home)
