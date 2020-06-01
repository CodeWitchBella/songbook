import React, { useEffect } from 'react'
import { Switch, Route } from 'react-router'
import NotFound from './not-found'
import PrivacyPolicy from './privacy-policy'
import { getGraphqlUrl } from 'store/graphql'

const CollectionList = React.lazy(() =>
  import(/* webpackChunkName: "r-home" */ './collection-list'),
)

const Collection = React.lazy(() =>
  import(/* webpackChunkName: "r-home" */ './collection'),
)

const AllSongs = React.lazy(() =>
  import(/* webpackChunkName: "r-all-songs" */ './all-songs'),
)

const Home = React.lazy(() => import(/* webpackChunkName: "r-home" */ './home'))

const Song = React.lazy(() => import(/* webpackChunkName: "r-song" */ './song'))

const Print = React.lazy(() =>
  import(/* webpackChunkName: "r-print" */ './print'),
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

export default function Routes() {
  return (
    <Switch>
      <Route path="/" exact>
        <Home />
      </Route>
      <Route path="/all-songs" exact>
        <AllSongs />
      </Route>
      <Route path="/collections" exact>
        <CollectionList />
      </Route>
      <Route
        path="/collections/:slug/:slug2?"
        render={({ match }) => (
          <Collection
            slug={
              match.params.slug +
              (match.params.slug2 ? '/' + match.params.slug2 : '')
            }
          />
        )}
      />
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
      <Route path="/changelog" exact render={() => <Changelog />} />
      <Route path="/privacy-policy" exact render={() => <PrivacyPolicy />} />
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
