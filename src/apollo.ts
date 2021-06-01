import { ApolloServer } from "apollo-server-cloudflare";
import { renderPlaygroundPage } from "@apollographql/graphql-playground-html";
import { graphqlCloudflare } from "apollo-server-cloudflare/dist/cloudflareApollo";

export function handleApollo(request: Request, server: ApolloServer): Response {
  if (request.method === "GET") {
    return new Response(
      renderPlaygroundPage((server as any).playgroundOptions),
      { headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }
  return graphqlCloudflare(() =>
    server.createGraphQLServerOptions(request as any),
  )(request as any) as any;
}
