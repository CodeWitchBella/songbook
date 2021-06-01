import { ApolloServer, Config } from "apollo-server-cloudflare";
import { graphqlCloudflare } from "apollo-server-cloudflare/dist/cloudflareApollo";

export function handleApollo(request: Request, options: Config): Response {
  const server = new ApolloServer(options);
  return graphqlCloudflare(() =>
    server.createGraphQLServerOptions(request as any),
  )(request as any) as any;
}
