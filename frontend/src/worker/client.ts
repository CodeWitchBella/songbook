import { wrap, type Remote } from "comlink";
import { useEffect } from "react";

import { songStoreChannel, type SongStoreApi } from "./types";

let remote: Remote<SongStoreApi> | null = null;

/**
 * Connect to the shared song-store worker (one instance for all tabs).
 * Safe to call repeatedly — from clientLoaders, hooks, event handlers.
 */
export function getSongStore(): Remote<SongStoreApi> {
  if (!remote) {
    const worker = new SharedWorker(new URL("./song-store.worker.ts", import.meta.url), {
      type: "module",
      name: "songbook-song-store",
    });
    remote = wrap<SongStoreApi>(worker.port);
  }
  return remote;
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
