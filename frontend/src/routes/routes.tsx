import React from 'react'
import { Switch, Route, Redirect } from 'react-router'
import Loadable from 'react-loadable'
import NotFound from './not-found'

const loading = () => <div>Načítám...</div>

const Home = Loadable({
  loader: () => import(/* webpackChunkName: "r-home" */ './home'),
  loading,
  modules: ['./home'],
  webpack: () => [require.resolveWeak('./home')],
})

const Song = Loadable({
  loader: () => import(/* webpackChunkName: "r-song" */ './song'),
  loading,
  modules: ['./song'],
  webpack: () => [require.resolveWeak('./song')],
})

const Print = Loadable({
  loader: () => import(/* webpackChunkName: "r-print" */ './print'),
  loading,
  modules: ['./print'],
  webpack: () => [require.resolveWeak('./print')],
})

const Tag = Loadable({
  loader: () => import(/* webpackChunkName: "r-tag" */ './tag'),
  loading,
  modules: ['./tag'],
  webpack: () => [require.resolveWeak('./tag')],
})

export default () => (
  <Switch>
    <Route path="/" exact>
      <Home />
    </Route>
    <Route
      path="/song/:id"
      exact
      render={({ match }) => <Song id={match.params.id} />}
    />
    <Route
      path="/print/:tag"
      exact
      render={({ match }) => <Print tag={match.params.tag} />}
    />
    <Route
      path="/tag/:tag"
      exact
      render={({ match }) => <Tag tag={match.params.tag} />}
    />
    <Route>
      <NotFound />
    </Route>
  </Switch>
)
