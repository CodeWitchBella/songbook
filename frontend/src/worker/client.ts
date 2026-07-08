import { wrap, type Remote } from "comlink";
import { useEffect } from "react";

import type { WorkerApi } from "./store.worker";
import { collectionStoreChannel, songStoreChannel } from "./types";

let remote: Remote<WorkerApi> | null = null;

/**
 * Connect to the shared store worker (one instance for all tabs), hosting
 * both the song and collection stores.
 * Safe to call repeatedly — from clientLoaders, hooks, event handlers.
 */
function getWorker(): Remote<WorkerApi> {
  if (!remote) {
    const worker = new SharedWorker(new URL("./store.worker.ts", import.meta.url), {
      type: "module",
      name: "songbook-store",
    });
    remote = wrap<WorkerApi>(worker.port);
  }
  return remote;
}

export function getSongStore(): Remote<WorkerApi>["song"] {
  return getWorker().song;
}

export function getCollectionStore(): Remote<WorkerApi>["collection"] {
  return getWorker().collection;
}

/**
 * Subscribe to the worker's "something changed" broadcasts. The payload
 * carries no detail on purpose: re-query the store on every notification.
 */
export function onSongStoreChange(callback: () => void): () => void {
  const channel = new BroadcastChannel(songStoreChannel);
  channel.onmessage = () => callback();
  return () => channel.close();
}

/** React hook variant, meant to trigger clientLoader revalidation. */
export function useSongStoreChange(callback: () => void) {
  useEffect(() => onSongStoreChange(callback), [callback]);
}

export function onCollectionStoreChange(callback: () => void): () => void {
  const channel = new BroadcastChannel(collectionStoreChannel);
  channel.onmessage = () => callback();
  return () => channel.close();
}

/** React hook variant, meant to trigger clientLoader revalidation. */
export function useCollectionStoreChange(callback: () => void) {
  useEffect(() => onCollectionStoreChange(callback), [callback]);
}
