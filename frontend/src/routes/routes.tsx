import { NotFound } from "#/components/error-page";
import { RouteRenderedMarker } from "#/components/service-worker-status";
import React, { Component, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  createRoutesFromElements,
  Navigate,
  Outlet,
  Route,
  RouterProvider,
  useLocation,
  useNavigate,
  createBrowserRouter,
} from "react-router";

const imports = {
  CollectionList: once(() => import("./collection-list")),
  Collection: once(() => import("./collection")),
  AllSongs: once(() => import("./all-songs")),
  Home: once(() => import("./home")),
  Song: once(() => import("./song")),
  AddToCollection: once(() => import("./add-to-collection")),
  CreateSong: once(() => import("./create-song")),
  EditSong: once(() => import("./edit-song")),
  Changelog: once(() => import("./changelog")),
  Login: once(() => import("./login")),
  Register: once(() => import("./register")),
  Credits: once(() => import("./credits")),
  About: once(() => import("./about")),
  QuickSettings: once(() => import("./quick-settings")),
  Chords: once(() => import("./chords")),
  CollectionDiff: once(() => import("./collection-diff")),
};

const router = createBrowserRouter(
  [
    {
      path: "*",
      element: <RootRoute />,
      children: createRoutesFromElements(
        <>
          <Route index={true} lazy={imports.Home} />
          <Route path="installed-home" element={<Navigate to="/" replace={true} />} />
          <Route path="login" lazy={imports.Login} />
          <Route path="register" lazy={imports.Register} />
          <Route path="all-songs" lazy={imports.AllSongs} />
          <Route path="credits" lazy={imports.Credits} />
          <Route path="quick-settings" lazy={imports.QuickSettings} />
          <Route path="about" lazy={imports.About} />
          <Route path="add-to-collection/:slug" lazy={imports.AddToCollection} />
          <Route path="collections" lazy={imports.CollectionList} />
          <Route path="collections/:slug/:slug2" lazy={imports.Collection} />
          <Route path="collections/:slug" lazy={imports.Collection} />
          <Route path="song/:slug" lazy={imports.Song} />
          <Route path="new" lazy={imports.CreateSong} />
          <Route path="new/:type" lazy={imports.CreateSong} />
          <Route path="edit/:slug" lazy={imports.EditSong} />
          <Route path="changelog" lazy={imports.Changelog} />
          <Route path="chords" lazy={imports.Chords} />
          <Route path="diff" lazy={imports.CollectionDiff} />

          <Route path="*" element={<NotFound />} />
        </>,
      ),
    },
  ],
  { future: {} },
);

export function Routes() {
  return <RouterProvider router={router} />;
}

function RootRoute() {
  const location = useLocation();

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
  );
}

class ErrorBoundary extends Component<{
  children: React.ReactNode;
}> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: any) {
    console.error({ error, info });
  }

  reset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <Fallback reset={this.reset} />;
    }
    return this.props.children;
  }
}

function Fallback({ reset }: { reset: () => void }) {
  const location = useLocation();
  const last = useRef(location);
  const { t } = useTranslation();
  const navigate = useNavigate();
  useEffect(() => {
    if (last.current !== location) reset();
  }, [location, reset]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2">
      <div className="text-3xl">{t("Something went wrong")}</div>
      {location.state?.canGoBack ? (
        <button className="underline" onClick={() => void navigate(-1)}>
          {t("Go back")}
        </button>
      ) : location.pathname === "/" ? null : (
        <button className="underline" onClick={() => void navigate("/")}>
          {t("Go to home screen")}
        </button>
      )}
    </div>
  );
}

const loadAllRoutes = once(async () => {
  for (const imp of Object.values(imports)) {
    try {
      await imp();
    } catch {}
    // since script parsing may happen on main thread give it some breathing space
    await new Promise(res => setTimeout(res, 100));
  }
});

function LoadAllRoutes() {
  useEffect(() => {
    loadAllRoutes().catch(() => {});
  }, []);
  return null;
}

function once<T>(arg: () => T): () => T {
  let cache: T | null = null;
  let loaded = false;
  return () => {
    if (!loaded) {
      cache = arg();
      loaded = true;
    }
    return cache as T;
  };
}
