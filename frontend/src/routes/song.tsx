import React from 'react'
import Song from 'sections/song/song'
import { ScrollToTopOnMount } from 'components/scroll'
import { errorBoundary } from 'containers/error-boundary'

const SongRoute = ({ slug }: { slug: string }) => (
  <main>
    <ScrollToTopOnMount />
    <Song slug={slug} enableMenu />
  </main>
)
export default errorBoundary(SongRoute)
