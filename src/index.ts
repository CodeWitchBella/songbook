import { ApolloServer } from "apollo-server-cloudflare";
import { handleApollo } from "./apollo";
import serverConfig from "./lib/server-config";
import { handleUltimateGuitar } from "./ultimate-guitar";

const server = new ApolloServer(serverConfig);

async function handleRequest(request: Request) {
  try {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api")) url.pathname = url.pathname.slice(4);
    if (url.pathname === "/hello") return new Response("World");
    if (url.pathname === "/graphql") return await handleApollo(request, server);
    if (url.pathname === "/ultimate-guitar")
      return await handleUltimateGuitar(request);
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error(err.stack);
    return new Response(err.stack, {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});
