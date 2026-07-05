import { captureException } from "@sentry/react";

export async function retryingNetworkLoad<T>(load: () => Promise<T>): Promise<T> {
  let timeout = 100;
  while (true) {
    try {
      return await load();
    } catch (e) {
      console.error(e);
      captureException(e);
      let handle;
      let resetTimeout: () => void = () => {};
      const connection = (navigator as any).connection;
      await new Promise<void>(res => {
        resetTimeout = () => {
          res();
          timeout = 100;
        };
        handle = setTimeout(res, timeout);
        timeout *= 2;
        if (timeout >= 30000) timeout = 30000;

        // listen to various events that might indicate it would be a good
        // idea to retry now
        window.addEventListener("online", resetTimeout);
        document.addEventListener("visibilitychange", resetTimeout);
        connection?.addEventListener("change", resetTimeout);
      });
      clearTimeout(handle);
      window.removeEventListener("online", resetTimeout);
      document.removeEventListener("visibilitychange", resetTimeout);
      connection?.removeEventListener("change", resetTimeout);
    }
  }
}
