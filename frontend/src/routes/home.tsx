import React from 'react'
import { hot } from 'react-hot-loader'
import styled from 'react-emotion'
import SongList from 'sections/song-list/song-list'

const Home = () => (
  <div>
    <SongList tag="all" />
  </div>
)
export default hot(module)(Home)
