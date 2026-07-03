import { client } from "./client";

export function getApiUrl() {
  if (typeof window === "undefined") throw new Error("This is only available in browser");
  return new URL("/api/", window.location.toString()).toString();
}

let promise = Promise.resolve(null as any);

function enqueue<T>(run: () => Promise<T>): Promise<T> {
  const p = promise.catch(() => {}).then(run);
  promise = p;
  return p;
}

export function restFetch<V = any>(operation: string, variables?: V) {
  const tmpe = new Error();
  return enqueue(async () => {
    const req = await fetch(`/api/rest/${operation}`, {
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(variables ?? {}),
      method: "POST",
    });
    const json = await req.json();
    if (json.errors) {
      const error = new Error("Network error: REST request failed");
      (error as any).data = json;
      error.stack = tmpe.stack;
      throw error;
    }
    return json;
  });
}

export type User = {
  name: string;
  admin: boolean;
  handle?: string;
  picture: {
    url: string;
    width: number;
    height: number;
  };
};

export async function login(
  email: string,
  password: string,
): Promise<{ type: "success"; user: User } | { type: "error"; message: string }> {
  const { data, error } = await client.POST("/login", {
    body: { email, password },
  });
  if (error) return { type: "error", message: error.message };
  return { type: "success", user: data.user as User };
}

export async function register(
  email: string,
  password: string,
  name: string,
): Promise<{ type: "success"; user: User } | { type: "error"; message: string }> {
  return restFetch("register", { input: { email, password, name } }).then(v => {
    if (v.data.register.__typename !== "RegisterSuccess") {
      console.log(v.data.register);
      return { type: "error", message: v.data.register.message };
    }
    return { type: "success", user: v.data.register.user };
  });
}
