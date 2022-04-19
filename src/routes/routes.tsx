import React, { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router'
import { getGraphqlUrl } from 'store/graphql'
import { RouteRenderedMarker } from 'components/service-worker-status'
import ErrorBoundary from 'containers/error-boundary'
import { NotFound } from 'components/error-page'

const imports = {
  CollectionList: once(() => import('./collection-list')),
  Collection: once(() => import('./collection')),
  AllSongs: once(() => import('./all-songs')),
  Home: once(() => import('./home')),
  Logo: once(() => import('./logo')),
  Song: once(() => import('./song')),
  AddToCollection: once(() => import('./add-to-collection')),
  CreateSong: once(() => import('./create-song')),
  EditSong: once(() => import('./edit-song')),
  Changelog: once(() => import('./changelog')),
  Login: once(() => import('./login')),
  Register: once(() => import('./register')),
  Credits: once(() => import('./credits')),
  About: once(() => import('./about')),
}

const CollectionList = React.lazy(imports.CollectionList)
const Collection = React.lazy(imports.Collection)
const AllSongs = React.lazy(imports.AllSongs)
const Home = React.lazy(imports.Home)
const Logo = React.lazy(imports.Logo)
const Song = React.lazy(imports.Song)
const CreateSong = React.lazy(imports.CreateSong)
const EditSong = React.lazy(imports.EditSong)
const Changelog = React.lazy(imports.Changelog)
const Login = React.lazy(imports.Login)
const Register = React.lazy(imports.Register)
const AddToCollection = React.lazy(imports.AddToCollection)
const Credits = React.lazy(imports.Credits)
const About = React.lazy(imports.About)

function AbsoluteRedirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.assign(to)
  })
  return null
}

function AppRoutes() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route index={true} element={<Home />} />
        <Route path="logo" element={<Logo />} />
        <Route
          path="installed-home"
          element={<Navigate to="/" replace={true} />}
        />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="all-songs" element={<AllSongs />} />
        <Route path="credits" element={<Credits />} />
        <Route path="about" element={<About />} />
        <Route path="add-to-collection/:slug" element={<AddToCollection />} />
        <Route path="collections" element={<CollectionList />} />

        <Route path="collections/:slug/:slug2" element={<Collection />} />
        <Route path="collections/:slug" element={<Collection />} />
        <Route path="song/:slug" element={<Song />} />
        <Route path="new" element={<CreateSong />} />
        <Route path="new/:type" element={<CreateSong />} />
        <Route path="edit/:slug" element={<EditSong />} />
        <Route path="changelog" element={<Changelog />} />
        <Route
          path="graphql"
          element={<AbsoluteRedirect to={getGraphqlUrl()} />}
        />
        <Route element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
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
      <AppRoutes />
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
