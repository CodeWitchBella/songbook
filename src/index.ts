import { ApolloServer, gql } from "apollo-server-cloudflare";
import { handleApollo } from "./apollo";

const server = new ApolloServer({
  introspection: true,
  playground: true,
  debug: true,
  typeDefs: gql`
    type Query {
      hello: String!
    }
  `,
  resolvers: {
    Query: {
      hello() {
        return "world";
      },
    },
  },
});

async function handleRequest(request: Request) {
  if (new URL(request.url).pathname === "/hello") return new Response("World");
  try {
    return await handleApollo(request, server);
  } catch (err) {
    return new Response(err.stack, {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});
