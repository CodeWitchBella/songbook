import React, { useEffect } from 'react'
import { Switch, Route } from 'react-router'
import NotFound from './not-found'
import PrivacyPolicy from './privacy-policy'
import LoginFB from './login-fb'
import { getGraphqlUrl } from 'store/graphql'

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

function AbsoluteRedirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.assign(to)
  })
  return null
}

export default class Routes extends React.Component {
  render() {
    return (
      <Switch>
        <Route path="/" exact>
          <Home />
        </Route>
        <Route
          path="/song/:slug"
          exact
          render={({ match }) => <Song slug={match.params.slug} />}
        />
        <Route path="/new" exact render={() => <CreateSong />} />
        <Route
          path="/edit/:slug"
          exact
          render={({ match }) => <EditSong slug={match.params.slug} />}
        />
        <Route
          path="/pdf/:slug"
          exact
          render={({ match }) => <PDF slug={match.params.slug} />}
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
        <Route path="/privacy-policy" exact render={() => <PrivacyPolicy />} />
        <Route path="/login/fb" exact render={() => <LoginFB />} />
        <Route
          path="/graphql"
          exact
          render={() => <AbsoluteRedirect to={getGraphqlUrl()} />}
        />
        <Route>
          <NotFound />
        </Route>
      </Switch>
    )
  }
}
