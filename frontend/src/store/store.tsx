import localForage from "localforage";
import { useEffect, useState } from "react";

import { newSong } from "./fetchers";
import type { User } from "./api";
import { getSongStore } from "#/worker/client";

const settingsStorage = localForage.createInstance({ name: "settings" });

function useCachedState<T>(key: string, initial: T | null) {
  const st = useState<T | null>(initial);
  const [v, setV] = st;
  useEffect(() => {
    settingsStorage.getItem<T>(key).then(itm => setV(itm));
  }, [key, setV]);
  useEffect(() => {
    settingsStorage.setItem<T | null>(key, v);
  }, [key, v]);
  return st;
}

export function useNewSong() {
  return async ({
    author,
    title,
    text,
    extraNonSearchable,
  }: {
    author: string;
    title: string;
    text?: string;
    extraNonSearchable?: string;
  }) => {
    const ret = await newSong({ author, title, text, extraNonSearchable });
    await getSongStore().triggerRefetch();
    return ret;
  };
}

// Stubbed to work without StoreProvider (being phased out): keeps its own
// cached state instead of going through the old store context.
export function useViewer() {
  const [viewer, setViewer] = useCachedState<User>("viewer", null);
  return [viewer, setViewer] as const;
}
