import React from 'react'
import SongList from 'sections/song-list/song-list'
import { InstallButton } from 'components/install'
import styled from '@emotion/styled'
import Button from 'components/button'
import { SaveScroll } from 'components/scroll'
import { errorBoundary } from 'containers/error-boundary'

const InstallContainer = styled.div`
  position: absolute;
  bottom: 0;
  display: flex;
  justify-content: center;
  height: 150px;
  align-items: center;
  width: 100%;
`

const Tag = ({ tag }: { tag: string }) => (
  <div>
    <SaveScroll />
    <SongList tag={tag} showPrint />

    <InstallButton>
      {install => (
        <InstallContainer>
          <Button onClick={install}>Nainstalovat jako appku</Button>
        </InstallContainer>
      )}
    </InstallButton>
  </div>
)
export default errorBoundary(Tag)
