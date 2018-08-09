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

const TopLinks = styled.div`
  font-size: 18px;
  display: block;
  text-align: center;
  padding-top: 20px;
  a {
    padding: 0 10px;
    color: darkblue;
  }
`

const googleDoc =
  'https://docs.google.com/document/d/1SVadEFoM9ppFI6tOhOQskMs53UxHK1EWYZ7Lr4rAFoc/edit?usp=sharing'

const Home = () => (
  <div>
    <TopLinks>
      <Link to="/new">Create song</Link>
      <a href={googleDoc} target="_blank" rel="noopener noreferrer">
        Suggestions
      </a>
      <Link to="/changelog">Changelog</Link>
    </TopLinks>
    <TagList />
    <Spacer />
    <InstallContainer>
      <InstallButton />
    </InstallContainer>
  </div>
)
export default hot(module)(Home)
