import { handleCreateSong } from "./endpoints/create-song.js";
import { handleGraphql } from "./endpoints/graphql.js";
import { handleImport } from "./endpoints/import.js";
import { handleLogin } from "./endpoints/login.js";
import { handleLogout } from "./endpoints/logout.js";
import { handleReleases } from "./endpoints/releases.js";
import { forward } from "./forward.js";
import type { MyContext } from "./lib/context.js";
import { contextPair } from "./lib/context.js";

async function handleRequest(
  request: Request,
  createContext: () => Promise<MyContext>,
): Promise<Response> {
  try {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api")) url.pathname = url.pathname.slice(4);
    if (url.pathname === "/hello") return new Response("World");
    if (url.pathname === "/graphql")
      return await handleGraphql(request, await createContext());
    if (request.method === "POST") {
      if (url.pathname === "/login")
        return await handleLogin(request, await createContext());
      if (url.pathname === "/logout")
        return await handleLogout(await createContext());
      if (url.pathname === "/song")
        return await handleCreateSong(request, await createContext());
    }
    if (url.pathname === "/ultimate-guitar" || url.pathname === "/import")
      return await handleImport(request);
    if (url.pathname === "/releases") return await handleReleases(request);
    if (url.pathname === "/beacon.min.js")
      return await forward(
        request,
        "https://static.cloudflareinsights.com/beacon.min.js",
      );
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error(err.stack);
    return new Response(err.stack, {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}

// @ts-expect-error
globalThis.process = { env: {} };
// @ts-expect-error
globalThis.setImmediate = (cb) => setTimeout(cb, 0);
// @ts-expect-error
globalThis.clearImmediate = (handle) => clearTimeout(handle);

const worker = {
  port: 5512,
};
Deno.serve(worker, async function fetch(request: Request): Promise<Response> {
  const { createContext, finishContext } = contextPair(request);
  const res = await handleRequest(request, createContext);
  finishContext(res);
  return res;
});

console.log("listening on http://localhost:5512");
