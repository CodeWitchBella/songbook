import React from 'react'
import { hot } from 'react-hot-loader'
import styled from 'react-emotion'
import SongList from 'sections/song-list/song-list'
import { InstallButton } from 'components/install'
import Button from 'components/button'
import { SaveScroll } from 'components/scroll'

const InstallContainer = styled.div`
  position: absolute;
  bottom: 0;
  display: flex;
  justify-content: center;
  height: 150px;
  align-items: center;
  width: 100%;
`

const Home = () => (
  <div>
    <SaveScroll />
    <SongList tag="all" />
    <InstallButton>
      {install => (
        <InstallContainer>
          <Button onClick={install}>Nainstalovat jako appku</Button>
        </InstallContainer>
      )}
    </InstallButton>
  </div>
)
export default hot(module)(Home)
