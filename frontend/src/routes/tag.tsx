import React from 'react'
import { hot } from 'react-hot-loader'
import SongList from 'sections/song-list/song-list'
import { InstallButton } from 'components/install'
import styled from 'react-emotion'
import Button from 'components/button'

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
export default hot(module)(Tag)
