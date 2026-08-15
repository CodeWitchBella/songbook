import React, { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import type { ServiceWorkerRegisterConfig } from "#/serviceWorker";
import type { Workbox } from "workbox-window";

const context = React.createContext({
  routeRendered: () => {},
});

export function ServiceWorkerStatusProvider({
  children,
  register,
}: {
  children: React.ReactNode;
  register: (config?: ServiceWorkerRegisterConfig) => void;
}) {
  const updatedRef = useRef(null as null | Workbox);

  // Tell the waiting worker to take over. It becoming the controller triggers
  // the page reload (see the "controlling" handler in serviceWorker.ts), so
  // this may only be called at a moment where a reload is acceptable.
  //
  // Clearing the ref first makes this idempotent: without it every later
  // navigation re-posts SKIP_WAITING to a worker that already skipped.
  const activateUpdate = useCallback((delayMs: number) => {
    const updated = updatedRef.current;
    if (!updated) return;
    updatedRef.current = null;
    setTimeout(() => {
      updated.messageSW({ type: "SKIP_WAITING" });
    }, delayMs);
  }, []);

  useEffect(() => {
    register({
      onUpdate: wb => {
        console.log("Update available!");
        updatedRef.current = wb;
      },
    });
  }, [register]);

  // A tab going into the background is the least disruptive possible moment to
  // swap versions: the reload finishes before the user looks at it again. This
  // matters because a pathname change alone is not enough -- someone parked on
  // a single song can go a long time without one.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "hidden") return;
      activateUpdate(0);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [activateUpdate]);

  return (
    <context.Provider
      value={useMemo(
        () => ({
          routeRendered: () => {
            console.log("ServiceWorkerStatusProvider:routeRendered");
            // A small delay lets the newly rendered route paint first, so the
            // reload lands on a screen the user has already moved away from.
            activateUpdate(10);
          },
        }),
        [activateUpdate],
      )}
    >
      {children}
    </context.Provider>
  );
}

export function RouteRenderedMarker() {
  const { routeRendered } = useContext(context);
  useEffect(() => {
    routeRendered();
  }, [routeRendered]);
  return null;
}
