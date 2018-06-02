import React from 'react'
import { hot } from 'react-hot-loader'
import Song from 'sections/song/song'

const SongRoute = ({ id }: { id: string }) => (
  <div>
    <Song id={id} />
  </div>
)
export default hot(module)(SongRoute)
