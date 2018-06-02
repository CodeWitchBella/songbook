import React from 'react'
import { hot } from 'react-hot-loader'
import SongList from 'sections/song-list/song-list'

const Home = ({ id }: { id: string }) => <div>Song {id}</div>
export default hot(module)(Home)
