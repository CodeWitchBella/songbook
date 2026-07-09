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

/**
 * Run an API call through {@link enqueue}, rejecting on transport/HTTP errors
 * and returning the response body otherwise.
 */
function call<D>(run: () => Promise<{ data?: D; error?: unknown }>): Promise<D> {
  const tmpe = new Error();
  return enqueue(async () => {
    const { data, error } = await run();
    if (error) {
      const err = new Error("Network error: REST request failed");
      (err as any).data = error;
      err.stack = tmpe.stack;
      throw err;
    }
    return data as D;
  });
}

export function restUpdateSong(id: string, input: Record<string, unknown>) {
  return call(() => client.POST("/update-song", { body: { id, input } }));
}

export function restAddToCollection(collection: string, song: string) {
  return call(() => client.POST("/add-to-collection", { body: { collection, song } }));
}

export function restRemoveFromCollection(collection: string, song: string) {
  return call(() => client.POST("/remove-from-collection", { body: { collection, song } }));
}

export function restCreateCollection(name: string) {
  return call(() => client.POST("/create-collection", { body: { name } }));
}

export function restRegister(input: { email: string; password: string; name: string }) {
  return call(() => client.POST("/register", { body: { input } }));
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
  return restRegister({ email, password, name }).then(v => {
    if (v.register.__typename !== "RegisterSuccess") {
      console.log(v.register);
      return { type: "error", message: v.register.message ?? "Registration failed" };
    }
    return { type: "success", user: v.register.user as User };
  });
}
