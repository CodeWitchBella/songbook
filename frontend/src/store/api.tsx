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
 * Run a `/rest/*` GraphQL-proxy call: serialize it through {@link enqueue},
 * reject on transport or GraphQL errors, and return the `data` payload.
 */
function call<D>(
  run: () => Promise<{ data?: { data?: D; errors?: unknown }; error?: unknown }>,
): Promise<D> {
  const tmpe = new Error();
  return enqueue(async () => {
    const { data, error } = await run();
    const envelope = error ?? data;
    if (error || (envelope as { errors?: unknown } | undefined)?.errors) {
      const err = new Error("Network error: REST request failed");
      (err as any).data = envelope;
      err.stack = tmpe.stack;
      throw err;
    }
    return (data as { data: D }).data;
  });
}

export function restSongs(variables: {
  modifiedAfter: string | null;
  deletedAfter: string;
  skipDeleted: boolean;
}) {
  return call(() => client.POST("/rest/songs", { body: variables }));
}

export function restUpdateSong(id: string, input: Record<string, unknown>) {
  return call(() => client.POST("/rest/update-song", { body: { id, input } }));
}

export function restCollections(variables: { modifiedAfter: string | null }) {
  return call(() => client.POST("/rest/collections", { body: variables }));
}

export function restAddToCollection(collection: string, song: string) {
  return call(() => client.POST("/rest/add-to-collection", { body: { collection, song } }));
}

export function restRemoveFromCollection(collection: string, song: string) {
  return call(() => client.POST("/rest/remove-from-collection", { body: { collection, song } }));
}

export function restCreateCollection(name: string) {
  return call(() => client.POST("/rest/create-collection", { body: { name } }));
}

export function restRegister(input: { email: string; password: string; name: string }) {
  return call(() => client.POST("/rest/register", { body: { input } }));
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
