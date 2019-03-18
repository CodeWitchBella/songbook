import React from 'react'
import SongList from 'sections/song-list/song-list'
import { InstallButtonLook } from 'components/install'
import { SaveScroll } from 'components/scroll'
import { errorBoundary } from 'containers/error-boundary'

const Tag = ({ tag }: { tag: string }) => (
  <div>
    <SaveScroll />
    <SongList tag={tag} showPrint />

    <InstallButtonLook />
  </div>
)
export default errorBoundary(Tag)
