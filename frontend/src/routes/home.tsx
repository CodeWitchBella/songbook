import React from 'react'
import { hot } from 'react-hot-loader'
import TagList from 'sections/tag-list/tag-list'
import { Link } from 'react-router-dom'
import { InstallButton } from 'components/install'
import styled from 'react-emotion'

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
    <Link
      css={`
        font-size: 18px;
        display: block;
        text-align: center;
        padding-top: 20px;
        color: darkblue;
      `}
      to="/new"
    >
      Create song
    </Link>
    <TagList />
    <Spacer />
    <InstallContainer>
      <InstallButton />
    </InstallContainer>
  </div>
)
export default hot(module)(Home)
