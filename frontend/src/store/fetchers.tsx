import { getGraphqlUrl } from "./graphql";

async function jsonPost(path: string, json: any) {
  const res = await fetch(new URL(path, getGraphqlUrl()).toString(), {
    body: JSON.stringify(json),
    method: "post",
    headers: { "content-type": "application/json" },
    credentials: "include",
  });
  return parseJsonResponse(res);
}

export async function jsonGet<SuccessBody = unknown>(path: string) {
  const res = await fetch(new URL(path, getGraphqlUrl()).toString(), {
    method: "get",
    credentials: "include",
  });
  return parseJsonResponse<SuccessBody>(res);
}

async function parseJsonResponse<SuccessBody>(
  res: Response
): Promise<
  { success: true; body: SuccessBody } | { success: false; body: any }
> {
  const isJson =
    res.headers.get("content-type")?.split(";")[0].trim() ===
    "application/json";
  if (!isJson) {
    return { success: false, body: await res.text() };
  }
  return {
    body: await res.json(),
    success: res.status === 200,
  };
}

export function newSong(song: {
  author: string;
  title: string;
  text?: string;
  extraNonSearchable?: string;
}): Promise<{ slug: string }> {
  return jsonPost("/api/song", song).then((v) => {
    if (v?.body?.slug) return v.body;
    throw new Error("New song failed");
  });
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
  const res = await jsonPost("/api/logout", {});
  if (res.success) throw new Error("Logout failed");
}
