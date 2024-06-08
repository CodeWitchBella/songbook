import { Workbox } from "workbox-window";

// This optional code is used to register a service worker.
// register() is not called by default.

// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on subsequent visits to a page, after all the
// existing tabs open on the page have been closed, since previously cached
// resources are updated in the background.

// To learn more about the benefits of this model and instructions on how to
// opt-in, read http://bit.ly/CRA-PWA

const isLocalhost = Boolean(
  window.location.hostname === "localhost" ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === "[::1]" ||
    // 127.0.0.1/8 is considered localhost for IPv4.
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/,
    ),
);

export type ServiceWorkerRegisterConfig = {
  onUpdate?: (wb: Workbox) => void;
};

export function register(config: ServiceWorkerRegisterConfig = {}) {
  if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      const swUrl = new URL("/service-worker.js", window.location.href).href;

      if (isLocalhost) {
        // This is running on localhost. Let's check if a service worker still exists or not.
        checkValidServiceWorker(swUrl, config);

        // Add some additional logging to localhost, pointing developers to the
        // service worker/PWA documentation.
        navigator.serviceWorker.ready.then(() => {
          console.log(
            "This web app is being served cache-first by a service " +
              "worker. To learn more, visit http://bit.ly/CRA-PWA",
          );
        });
      } else {
        // Is not localhost. Just register service worker
        registerValidSW(swUrl, config);
      }
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // This fires when the service worker controlling this page
      // changes, eg a new worker has skipped waiting and become
      // the new active worker.
      console.log("serviceWorker:controllerchange");
      window.location.reload();
    });
  }
}

function registerValidSW(swUrl: string, config: ServiceWorkerRegisterConfig) {
  const wb = new Workbox(swUrl);

  wb.addEventListener("controlling", () => {
    window.location.reload();
  });

  wb.addEventListener("waiting", () => {
    // At this point, the updated precached content has been fetched,
    // but the previous service worker will still serve the older
    // content until all client tabs are closed.
    console.log(
      "New content is available and will be used when all " +
        "tabs for this page are closed. See http://bit.ly/CRA-PWA.",
    );
    // Execute callback
    if (config && config.onUpdate) {
      config.onUpdate(wb);
    }
  });

  wb.register();
  wb.update();
}

function checkValidServiceWorker(
  swUrl: string,
  config: ServiceWorkerRegisterConfig,
) {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl)
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get("content-type");
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf("javascript") === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log(
        "No internet connection found. App is running in offline mode.",
      );
    });
}
