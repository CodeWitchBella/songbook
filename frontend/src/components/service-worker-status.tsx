import React, { useContext, useEffect, useMemo, useRef } from "react";
import type { ServiceWorkerRegisterConfig } from "serviceWorker";
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

  useEffect(() => {
    register({
      onUpdate: (wb) => {
        console.log("Update available!");
        updatedRef.current = wb;
      },
    });
  }, [register]);

  return (
    <context.Provider
      value={useMemo(
        () => ({
          routeRendered: () => {
            console.log("ServiceWorkerStatusProvider:routeRendered");
            const updated = updatedRef.current;
            if (updated) {
              setTimeout(() => {
                updated.messageSW({ type: "SKIP_WAITING" });
              }, 10);
            }
          },
        }),
        [],
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
