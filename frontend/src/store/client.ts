import createClient from "openapi-fetch";

import type { paths } from "./api-schema";

/**
 * Typed API client backed by the OpenAPI schema generated from the backend
 * (see `pnpm gen:api`). Paths, request bodies, params and responses are all
 * derived from `api-schema.d.ts`, so keep that file in sync with the backend.
 *
 * The whole API is mounted under `/api` by the server, and cookies carry the
 * session, so we set that as the base URL and always include credentials.
 */
export const client = createClient<paths>({
  baseUrl: "/api",
  credentials: "include",
});
