import React, { useEffect } from 'react'
import { Switch, Route, useLocation } from 'react-router'
import NotFound from './not-found'
import { getGraphqlUrl } from '../store/graphql'
import InstalledHome from './installed-home'
import { RouteRenderedMarker } from '../components/service-worker-status'

const imports = {
  CollectionList: once(() =>
    import(/* webpackChunkName: "r-collection-list" */ './collection-list'),
  ),
  Collection: once(() =>
    import(/* webpackChunkName: "r-collection" */ './collection'),
  ),
  AllSongs: once(() =>
    import(/* webpackChunkName: "r-all-songs" */ './all-songs'),
  ),
  Home: once(() => import(/* webpackChunkName: "r-home" */ './home')),
  Song: once(() => import(/* webpackChunkName: "r-song" */ './song')),
  CreateSong: once(() =>
    import(/* webpackChunkName: "r-create-song" */ './create-song'),
  ),
  EditSong: once(() =>
    import(/* webpackChunkName: "r-edit-song" */ './edit-song'),
  ),
  Changelog: once(() =>
    import(/* webpackChunkName: "r-changelog" */ './changelog'),
  ),
  Login: once(() => import(/* webpackChunkName: "r-login" */ './login')),
  Register: once(() =>
    import(/* webpackChunkName: "r-register" */ './register'),
  ),
}

const CollectionList = React.lazy(imports.CollectionList)
const Collection = React.lazy(imports.Collection)
const AllSongs = React.lazy(imports.AllSongs)
const Home = React.lazy(imports.Home)
const Song = React.lazy(imports.Song)
const CreateSong = React.lazy(imports.CreateSong)
const EditSong = React.lazy(imports.EditSong)
const Changelog = React.lazy(imports.Changelog)
const Login = React.lazy(imports.Login)
const Register = React.lazy(imports.Register)

function AbsoluteRedirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.assign(to)
  })
  return null
}

function Routes() {
  return (
    <Switch>
      <Route path="/" exact>
        <Home />
      </Route>
      <Route path="/installed-home" exact>
        <InstalledHome />
      </Route>
      <Route path="/login" exact>
        <Login />
      </Route>
      <Route path="/register" exact>
        <Register />
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
      <Route path="/changelog" exact render={() => <Changelog />} />
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

export default function WrappedRoutes() {
  const location = useLocation()

  // effects are only trigger after suspense resolves, so that is ideal time to
  // a) preload all code-split bundles (but sequentially to not hog all the resources)
  // b) reload page if service worker updated
  // reloading page should happen only on pathname change (not search, state nor hash)
  // because that is the time that it changes the most, so reload will be visible
  // the least
  return (
    <>
      <RouteRenderedMarker key={location.pathname} />
      <LoadAllRoutes />
      <Routes />
    </>
  )
}

const loadAllRoutes = once(async () => {
  for (const imp of Object.values(imports)) {
    try {
      await imp()
    } catch {}
    // since script parsing may happen on main thread give it some breathing space
    await new Promise((res) => setTimeout(res, 100))
  }
})

function LoadAllRoutes() {
  useEffect(() => {
    loadAllRoutes().catch(() => {})
  }, [])
  return null
}

function once<T>(arg: () => T): () => T {
  let cache: T | null = null
  let loaded = false
  return () => {
    if (!loaded) {
      cache = arg()
      loaded = true
    }
    return cache as T
  }
}
