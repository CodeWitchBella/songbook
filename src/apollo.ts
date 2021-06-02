import { ApolloServer } from "apollo-server-cloudflare";
import { renderPlaygroundPage } from "@apollographql/graphql-playground-html";
import { graphqlCloudflare } from "apollo-server-cloudflare/dist/cloudflareApollo";
import { MyContext } from "./lib/context";
import { createSetSessionCookieHeader, parseSessionCookie } from "./lib/cookie";

export async function handleApollo(
  request: Request,
  server: ApolloServer,
): Promise<Response> {
  if (request.method === "GET") {
    return new Response(
      renderPlaygroundPage((server as any).playgroundOptions),
      { headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }
  let hdr: ReturnType<typeof createSetSessionCookieHeader> | null = null;
  const context: MyContext = {
    sessionCookie: parseSessionCookie(request.headers.get("cookie")),
    setSessionCookie: (value, duration) => {
      hdr = createSetSessionCookieHeader(value, duration);
    },
    url: request.url,
  };
  const response = (await graphqlCloudflare(async () => ({
    ...(await server.createGraphQLServerOptions(request as any)),
    context,
  }))(request as any)) as Response;
  if (hdr) response.headers.set(hdr[0], hdr[1]);
  return response;
}
