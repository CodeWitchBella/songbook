import React from 'react'
import { Switch, Route } from 'react-router'
import NotFound from './not-found'

const Home = React.lazy(() => import(/* webpackChunkName: "r-home" */ './home'))

const Song = React.lazy(() => import(/* webpackChunkName: "r-song" */ './song'))

const Print = React.lazy(() =>
  import(/* webpackChunkName: "r-print" */ './print'),
)

const Tag = React.lazy(() => import(/* webpackChunkName: "r-tag" */ './tag'))

const TagList = React.lazy(() =>
  import(/* webpackChunkName: "r-tag-list" */ './tag-list'),
)

const CreateSong = React.lazy(() =>
  import(/* webpackChunkName: "r-create-song" */ './create-song'),
)

const EditSong = React.lazy(() =>
  import(/* webpackChunkName: "r-edit-song" */ './edit-song'),
)

const Changelog = React.lazy(() =>
  import(/* webpackChunkName: "r-changelog" */ './changelog'),
)
const PDF = React.lazy(() => import(/* webpackChunkName: "r-pdf" */ './pdf'))

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
        <Route path="/new" exact render={() => <CreateSong />} />
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
        <Route path="/tag" exact render={() => <TagList />} />
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
