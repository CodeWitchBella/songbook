import { ApolloServer, HeaderMap } from "@apollo/server";

import type { MyContext } from "../lib/context.ts";
import serverConfig from "../lib/graphql-server-config.ts";

const getServer = (() => {
  let cache: ApolloServer<MyContext>;
  return () => {
    if (!cache) {
      cache = new ApolloServer(serverConfig);
      cache.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();
    }
    return cache;
  };
})();

export async function handleGraphql(
  request: Request,
  context: MyContext
): Promise<Response> {
  const server = getServer();
  const response = await server.executeHTTPGraphQLRequest({
    httpGraphQLRequest: {
      method: request.method,
      body:
        request.method !== "GET" && request.method !== "HEAD"
          ? await request.json()
          : null,
      headers: new HeaderMap(request.headers.entries()),
      search: new URL(request.url).search,
    },
    context: () => context as any,
  });
  return new Response(
    response.body.kind === "complete" ? response.body.string : null,
    {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    }
  );
}
