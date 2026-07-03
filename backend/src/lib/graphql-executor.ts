import { ApolloServer, HeaderMap } from "@apollo/server";

import type { MyContext } from "#/lib/context.ts";
import serverConfig from "#/lib/graphql-server-config.ts";

export const getServer = (() => {
  let cache: ApolloServer<MyContext>;
  return () => {
    if (!cache) {
      cache = new ApolloServer(serverConfig);
      cache.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();
    }
    return cache;
  };
})();

/**
 * Execute a GraphQL operation and return the raw HTTP response. Shared by the
 * `/graphql` endpoint and the REST wrappers in `rest.ts`.
 */
export async function executeGraphql(
  { method, body, headers, search }: { method: string; body: unknown; headers: HeaderMap; search: string },
  context: MyContext,
): Promise<Response> {
  const server = getServer();
  const response = await server.executeHTTPGraphQLRequest({
    httpGraphQLRequest: { method, body, headers, search },
    context: () => context as any,
  });
  return new Response(response.body.kind === "complete" ? response.body.string : null, {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
  });
}
