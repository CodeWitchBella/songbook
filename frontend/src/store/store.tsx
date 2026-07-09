import localForage from "localforage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { newSong } from "./fetchers";
import type { User } from "./api";
import { getSongStore } from "#/worker/client";

const settingsStorage = localForage.createInstance({ name: "settings" });

const useViewerStore = create(
  persist(() => ({ viewer: null as User | null }), {
    name: "viewer",
    storage: createJSONStorage(() => settingsStorage),
  }),
);

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

export function useViewer() {
  const v = useViewerStore(s => s.viewer);
  const setViewer = (viewer: User | null) => useViewerStore.setState({ viewer });
  return [v, setViewer] as const;
}
