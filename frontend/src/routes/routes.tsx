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

const CreateSong = Loadable({
  loader: () => import(/* webpackChunkName: "r-create-song" */ './create-song'),
  loading,
  modules: ['./create-song'],
  webpack: () => [require.resolveWeak('./create-song')],
})

const EditSong = Loadable({
  loader: () => import(/* webpackChunkName: "r-edit-song" */ './edit-song'),
  loading,
  modules: ['./edit-song'],
  webpack: () => [require.resolveWeak('./edit-song')],
})

const Changelog = Loadable({
  loader: () => import(/* webpackChunkName: "r-changelog" */ './changelog'),
  loading,
  modules: ['./changelog'],
  webpack: () => [require.resolveWeak('./changelog')],
})

const PDF = Loadable({
  loader: () => import(/* webpackChunkName: "r-pdf" */ './pdf'),
  loading,
  modules: ['./pdf'],
  webpack: () => [require.resolveWeak('./pdf')],
})

export default class Routes extends React.Component {
  render() {
    return (
      <Switch>
        <Route path="/" exact>
          <Home />
        </Route>
        <Route
          path="/song/:id"
          exact
          render={({ match }) => <Song id={match.params.id} />}
        />
        <Route path="/new" exact render={({ match }) => <CreateSong />} />
        <Route
          path="/edit/:id"
          exact
          render={({ match }) => <EditSong id={match.params.id} />}
        />
        <Route
          path="/pdf/:id"
          exact
          render={({ match }) => <PDF id={match.params.id} />}
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
        <Route path="/changelog" exact render={() => <Changelog />} />
        <Route>
          <NotFound />
        </Route>
      </Switch>
    )
  }
}
