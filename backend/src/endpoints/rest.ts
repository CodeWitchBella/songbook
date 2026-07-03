import { HeaderMap } from "@apollo/server";

import { executeGraphql } from "#/lib/graphql-executor.ts";
import type { MyContext } from "#/lib/context.ts";
import { restOperations } from "#/lib/rest-operations.ts";

/**
 * Handle `/api/rest/<operation>`. The request body is the GraphQL variables
 * object; the matching query is looked up server-side and executed against the
 * GraphQL schema. The response is the standard GraphQL `{ data, errors }` JSON.
 */
export async function handleRest(operation: string, request: Request, context: MyContext): Promise<Response> {
  const query = restOperations[operation];
  if (!query) {
    return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  const variables = await request.json();
  return executeGraphql(
    {
      method: "POST",
      body: { query, variables },
      headers: new HeaderMap([["content-type", "application/json"]]),
      search: "",
    },
    context,
  );
}
