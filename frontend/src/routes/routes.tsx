import { NotFound } from 'components/error-page'
import { RouteRenderedMarker } from 'components/service-worker-status'
import React, { Component, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  createRoutesFromElements,
  Navigate,
  Outlet,
  Route,
  RouterProvider,
  useLocation,
  useNavigate,
} from 'react-router'
import { createBrowserRouter } from 'react-router-dom'

const imports = {
  CollectionList: once(() => import('./collection-list')),
  Collection: once(() => import('./collection')),
  AllSongs: once(() => import('./all-songs')),
  Home: once(() => import('./home')),
  Song: once(() => import('./song')),
  AddToCollection: once(() => import('./add-to-collection')),
  CreateSong: once(() => import('./create-song')),
  EditSong: once(() => import('./edit-song')),
  Changelog: once(() => import('./changelog')),
  Login: once(() => import('./login')),
  Register: once(() => import('./register')),
  Credits: once(() => import('./credits')),
  About: once(() => import('./about')),
  QuickSettings: once(() => import('./quick-settings')),
  Chords: once(() => import('./chords')),
  CollectionDiff: once(() => import('./collection-diff')),
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
const AddToCollection = React.lazy(imports.AddToCollection)
const Credits = React.lazy(imports.Credits)
const About = React.lazy(imports.About)
const QuickSettings = React.lazy(imports.QuickSettings)
const Chords = React.lazy(imports.Chords)
const CollectionDiff = React.lazy(imports.CollectionDiff)

function AbsoluteRedirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.assign(to)
  })
  return null
}

const router = createBrowserRouter([
  {
    path: '*',
    element: <RootRoute />,
    children: createRoutesFromElements(
      <>
        <Route index={true} element={<Home />} />
        <Route
          path="installed-home"
          element={<Navigate to="/" replace={true} />}
        />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="all-songs" element={<AllSongs />} />
        <Route path="credits" element={<Credits />} />
        <Route path="quick-settings" element={<QuickSettings />} />
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
        <Route path="chords" element={<Chords />} />
        <Route
          path="graphql"
          element={<AbsoluteRedirect to="/api/graphql" />}
        />
        <Route path="diff" element={<CollectionDiff />} />
        <Route path="*" element={<NotFound />} />
      </>,
    ),
  },
])

export function Routes() {
  return (
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  )
}

function RootRoute() {
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
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </>
  )
}

class ErrorBoundary extends Component<{
  children: React.ReactNode
}> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error, info: any) {
    console.error({ error, info })
  }

  reset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return <Fallback reset={this.reset} />
    }
    return this.props.children
  }
}

function Fallback({ reset }: { reset: () => void }) {
  const location = useLocation()
  const last = useRef(location)
  const { t } = useTranslation()
  const navigate = useNavigate()
  useEffect(() => {
    if (last.current !== location) reset()
  }, [location, reset])
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2">
      <div className="text-3xl">{t('Something went wrong')}</div>
      {location.state?.canGoBack ? (
        <button className="underline" onClick={() => void navigate(-1)}>
          {t('Go back')}
        </button>
      ) : location.pathname === '/' ? null : (
        <button className="underline" onClick={() => void navigate('/')}>
          {t('Go to home screen')}
        </button>
      )}
    </div>
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
