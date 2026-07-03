import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";

import { registerAddToCollection } from "#/endpoints/add-to-collection.ts";
import { registerCollections } from "#/endpoints/collections.ts";
import { registerCreateCollection } from "#/endpoints/create-collection.ts";
import { registerCreateSong } from "#/endpoints/create-song.ts";
import { registerImport } from "#/endpoints/import.ts";
import { registerLogin } from "#/endpoints/login.ts";
import { registerLogout } from "#/endpoints/logout.ts";
import { registerRegister } from "#/endpoints/register.ts";
import { registerReleases } from "#/endpoints/releases.ts";
import { registerRemoveFromCollection } from "#/endpoints/remove-from-collection.ts";
import { registerSongs } from "#/endpoints/songs.ts";
import { registerUpdateSong } from "#/endpoints/update-song.ts";
import { forward } from "#/forward.ts";
import type { MyContext } from "#/lib/context.ts";
import { contextPair } from "#/lib/context.ts";
import type { Variables } from "#/lib/openapi.ts";

/**
 * The API app. Everything is mounted under `/api` by the top-level server, so
 * routes here are defined without that prefix. Uses `@hono/zod-openapi` so the
 * OpenAPI 3.1 document is generated for free from the zod route schemas and
 * served at `/api/openapi.json` (with Swagger UI at `/api/docs`).
 *
 * Each endpoint owns its own file under `#/endpoints/<operation>.ts`, holding
 * both its route/schema definition (exported as `register<Operation>`) and its
 * handler. This file only builds the app, wires per-request context, calls each
 * endpoint's registration function, and exposes the OpenAPI document.
 */
export const api = new OpenAPIHono<{ Variables: Variables }>();

/**
 * Build a per-request {@link MyContext} lazily and apply any `Set-Cookie`
 * captured through `context.setSessionCookie` onto the outgoing response.
 */
api.use("*", async (c, next) => {
  const { createContext, finishContext } = contextPair(c.req.raw);
  let cached: Promise<MyContext> | null = null;
  c.set("makeContext", () => (cached ??= createContext()));
  await next();
  if (c.res) finishContext(c.res);
});

// ---------------------------------------------------------------------------
// /hello — health check
// ---------------------------------------------------------------------------

api.openapi(
  createRoute({
    method: "get",
    path: "/hello",
    summary: "Health check",
    responses: {
      200: { description: "Greeting", content: { "text/plain": { schema: z.string() } } },
    },
  }),
  c => c.text("World"),
);

// ---------------------------------------------------------------------------
// Endpoints — each registers its own route + schema.
// ---------------------------------------------------------------------------

registerLogin(api);
registerLogout(api);
registerCreateSong(api);
registerImport(api);
registerReleases(api);
registerRegister(api);
registerSongs(api);
registerUpdateSong(api);
registerCollections(api);
registerAddToCollection(api);
registerRemoveFromCollection(api);
registerCreateCollection(api);

// ---------------------------------------------------------------------------
// /beacon.min.js — Cloudflare analytics passthrough
// ---------------------------------------------------------------------------

api.get("/beacon.min.js", c => forward(c.req.raw, "https://static.cloudflareinsights.com/beacon.min.js"));

// ---------------------------------------------------------------------------
// OpenAPI document + Swagger UI
// ---------------------------------------------------------------------------

api.doc("/openapi.json", {
  openapi: "3.1.0",
  info: { title: "Songbook API", version: "1.0.0" },
});

api.get("/docs", swaggerUI({ url: "/api/openapi.json" }));
