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
    <Route>
      <NotFound />
    </Route>
  </Switch>
)
