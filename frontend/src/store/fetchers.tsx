import { client } from "./client";

export async function newSong(song: {
  author: string;
  title: string;
  text?: string;
  extraNonSearchable?: string;
}): Promise<{ slug: string }> {
  const { data } = await client.POST("/song", { body: song });
  if (data?.slug) return data;
  throw new Error("New song failed");
}

function pick(v: { [key: string]: any }, keys: string[]): any {
  const ret: any = {};
  for (const k of keys) {
    if (k in v) ret[k] = v[k];
  }
  return ret;
}

export function useTag() {
  if (false) return null;
  return { cover: "" };
}
export function useTags() {
  return [];
}

export async function logout(): Promise<void> {
  const { data } = await client.POST("/logout");
  if (!data?.ok) throw new Error("Logout failed");
}
