import { ApolloServer } from "apollo-server-cloudflare";
import { handleApollo } from "./apollo";
import serverConfig from "./lib/server-config";

const server = new ApolloServer(serverConfig);

async function handleRequest(request: Request) {
  if (new URL(request.url).pathname === "/hello") return new Response("World");
  try {
    return await handleApollo(request, server);
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
