globalThis.setImmediate = undefined as any;

import { ApolloServer } from "apollo-server-cloudflare";
import { handleGraphql } from "./endpoints/graphql";
import { forward } from "./forward";
import serverConfig from "./lib/server-config";
import { handleUltimateGuitar } from "./endpoints/ultimate-guitar";
import { contextPair, MyContext } from "./lib/context";
import { handleCreateSong } from "./endpoints/create-song";

async function handleRequest(
  request: Request,
  createContext: () => MyContext,
): Promise<Response> {
  try {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api")) url.pathname = url.pathname.slice(4);
    if (url.pathname === "/hello") return new Response("World");
    if (url.pathname === "/graphql")
      return await handleGraphql(request, createContext());
    if (url.pathname === "/ultimate-guitar")
      return await handleUltimateGuitar(request);
    if (request.method === "POST" && url.pathname === "/song")
      return await handleCreateSong(request, createContext());
    if (url.pathname === "/beacon.min.js")
      return await forward(
        request,
        "https://static.cloudflareinsights.com/beacon.min.js",
      );
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err.stack);
    return new Response(err.stack, {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}

addEventListener("fetch", event => {
  const { createContext, finishContext } = contextPair(event.request);
  event.respondWith(
    handleRequest(event.request, createContext).then(response => {
      finishContext(response);
      return response;
    }),
  );
});
