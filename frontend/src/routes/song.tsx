import React from 'react'
import { hot } from 'react-hot-loader'
import Song from 'sections/song/song'

const SongRoute = ({ id }: { id: string }) => (
  <main>
    <Song id={id} share enableSpotify />
  </main>
)
export default hot(module)(SongRoute)
