import { ApolloServer } from "apollo-server-cloudflare";
import { renderPlaygroundPage } from "@apollographql/graphql-playground-html";
import { graphqlCloudflare } from "apollo-server-cloudflare/dist/cloudflareApollo";
import { contextPair, MyContext } from "../lib/context";
import serverConfig from "../lib/server-config";

const getServer = (() => {
  let cache: ApolloServer;
  return () => {
    if (!cache) cache = new ApolloServer(serverConfig);
    return cache;
  };
})();

export async function handleGraphql(
  request: Request,
  context: MyContext,
): Promise<Response> {
  const server = getServer();
  if (request.method === "GET") {
    return new Response(
      renderPlaygroundPage((server as any).playgroundOptions),
      { headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }
  const response = (await graphqlCloudflare(async () => ({
    ...(await server.createGraphQLServerOptions(request as any)),
    context,
  }))(request as any)) as Response;
  return response;
}
