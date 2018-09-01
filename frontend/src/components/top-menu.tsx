import React from 'react'
import { Link, Route, Switch } from 'react-router-dom'
import styled from 'react-emotion'

const TopLinks = styled.div`
  font-size: 18px;
  display: block;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  text-align: center;
  padding: 15px 0;
  a {
    padding: 5px 10px;
    color: darkblue;
  }
`

const NotRoute: React.SFC<{ path: string; exact?: boolean }> = ({
  path,
  exact,
  children,
}) => (
  <Switch>
    <Route path={path} exact={exact} />
    <Route>{children}</Route>
  </Switch>
)

const googleDoc =
  'https://docs.google.com/document/d/1SVadEFoM9ppFI6tOhOQskMs53UxHK1EWYZ7Lr4rAFoc/edit?usp=sharing'
const TopMenu = () => (
  <TopLinks>
    <Link to="/new">Přidat&nbsp;píseň</Link>
    <a href={googleDoc} target="_blank" rel="noopener noreferrer">
      Návrhy
    </a>
    <Link to="/changelog">Změny</Link>
    <NotRoute exact path="/tag">
      <Link to="/tag">Tagy</Link>
    </NotRoute>
    <NotRoute exact path="/">
      <Link to="/">Všechny písně</Link>
    </NotRoute>
  </TopLinks>
)
export default TopMenu
