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
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/),
);

export type ServiceWorkerRegisterConfig = {
  onUpdate?: (wb: Workbox) => void;
};

export function register(config: ServiceWorkerRegisterConfig = {}) {
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
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
  }
}

// How often a tab that stays open re-checks for a new deployment. Without this
// the only update check is the one on page load, so a long-lived tab (or the
// installed PWA, which people leave open for days) never learns about a new
// version.
const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;

function registerValidSW(swUrl: string, config: ServiceWorkerRegisterConfig) {
  const wb = new Workbox(swUrl);

  wb.addEventListener("controlling", event => {
    // On a first-ever install the page goes from uncontrolled to controlled,
    // which is not an update and must not reload the page under the user.
    if (!event.isUpdate) return;
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

  // Keep checking while the tab lives. `update()` is a conditional request
  // against /service-worker.js, which the backend serves with
  // `max-age=0, must-revalidate`, so a no-op check is a cheap 304.
  const checkForUpdate = () => {
    if (document.visibilityState !== "visible") return;
    wb.update().catch(() => {
      // Offline, or the server is unreachable. Nothing to do; the next check
      // (or the next page load) will pick the update up.
    });
  };

  setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
  // Coming back to the tab, or back online, are the moments a user is most
  // likely to be about to use the app -- and most likely to have missed a
  // deployment while away.
  document.addEventListener("visibilitychange", checkForUpdate);
  window.addEventListener("online", checkForUpdate);
}

function checkValidServiceWorker(swUrl: string, config: ServiceWorkerRegisterConfig) {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl)
    .then(response => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get("content-type");
      if (response.status === 404 || (contentType != null && contentType.indexOf("javascript") === -1)) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then(registration => {
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
      console.log("No internet connection found. App is running in offline mode.");
    });
}
