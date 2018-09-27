import React from 'react'
import { hot } from 'react-hot-loader'
import TagList from 'sections/tag-list/tag-list'
import { InstallButton } from 'components/install'
import styled from 'react-emotion'
import TopMenu from 'components/top-menu'
import Button from 'components/button'

const Spacer = styled.div`
  height: 150px;
`

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
    <TopMenu />
    <TagList />
    <Spacer />

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
