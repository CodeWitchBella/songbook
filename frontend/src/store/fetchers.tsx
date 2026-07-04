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

export function useTag() {
  return { cover: "" };
}
export function useTags() {
  return [];
}

export async function logout(): Promise<void> {
  const { data } = await client.POST("/logout");
  if (!data?.ok) throw new Error("Logout failed");
}
