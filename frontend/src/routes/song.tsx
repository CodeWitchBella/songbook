import React from 'react'
import { hot } from 'react-hot-loader'
import Song from 'sections/song/song'
import { ScrollToTopOnMount } from 'components/scroll'

const SongRoute = ({ id }: { id: string }) => (
  <main>
    <ScrollToTopOnMount />
    <Song id={id} share enableSpotify />
  </main>
)
export default hot(module)(SongRoute)
