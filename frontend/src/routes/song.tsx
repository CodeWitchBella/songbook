import React from 'react'
import Song from 'sections/song/song'
import { ScrollToTopOnMount } from 'components/scroll'
import { errorBoundary } from 'containers/error-boundary'

const SongRoute = ({ id }: { id: string }) => (
  <main>
    <ScrollToTopOnMount />
    <Song id={id} share enableMenu />
  </main>
)
export default errorBoundary(SongRoute)
