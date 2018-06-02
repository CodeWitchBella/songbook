import React from 'react'
import { hot } from 'react-hot-loader'
import SongList from 'sections/song-list/song-list'

const Tag = ({ tag }: { tag: string }) => (
  <div>
    <SongList tag={tag} />
  </div>
)
export default hot(module)(Tag)
