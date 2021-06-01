import { Config } from "apollo-server-core";
import { gql } from "apollo-server-cloudflare";
import { handleApollo } from "./apollo";

const graphQLOptions: Config = {
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
};

async function handleRequest(request: Request) {
  try {
    return await handleApollo(request, graphQLOptions);
  } catch (err) {
    return new Response(graphQLOptions.debug ? err : "Something went wrong", {
      status: 500,
    });
  }
}

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});
