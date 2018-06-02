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

export default () => (
  <Switch>
    <Route path="/" exact>
      <Home />
    </Route>
    <Route>
      <NotFound />
    </Route>
  </Switch>
)
