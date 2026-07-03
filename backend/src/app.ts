import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";

import { handleCreateSong } from "#/endpoints/create-song.ts";
import { handleImport } from "#/endpoints/import.ts";
import { handleLogin } from "#/endpoints/login.ts";
import { handleLogout } from "#/endpoints/logout.ts";
import { handleReleases } from "#/endpoints/releases.ts";
import { handleRest } from "#/endpoints/rest.ts";
import { forward } from "#/forward.ts";
import type { MyContext } from "#/lib/context.ts";
import { contextPair } from "#/lib/context.ts";

type Variables = {
  makeContext: () => Promise<MyContext>;
};

/**
 * The API app. Everything is mounted under `/api` by the top-level server, so
 * routes here are defined without that prefix. Uses `@hono/zod-openapi` so the
 * OpenAPI 3.1 document is generated for free from the zod route schemas and
 * served at `/api/openapi.json` (with Swagger UI at `/api/docs`).
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
// Reusable schemas
// ---------------------------------------------------------------------------

const UserSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().nullable().optional(),
    admin: z.boolean().optional(),
    handle: z.string().nullable().optional(),
  })
  .passthrough()
  .openapi("User");

const ErrorMessageSchema = z.object({ message: z.string() }).openapi("ErrorMessage");
const ErrorSchema = z.object({ error: z.string() }).openapi("Error");

function json<T extends z.ZodTypeAny>(schema: T) {
  return { content: { "application/json": { schema } } };
}

// ---------------------------------------------------------------------------
// /hello
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
// /login
// ---------------------------------------------------------------------------

api.openapi(
  createRoute({
    method: "post",
    path: "/login",
    summary: "Log in with email and password",
    request: {
      body: json(z.object({ email: z.string(), password: z.string() }).openapi("LoginInput")),
    },
    responses: {
      200: { description: "Logged in", ...json(z.object({ user: UserSchema })) },
      401: { description: "Invalid credentials", ...json(ErrorMessageSchema) },
    },
  }),
  (async c => handleLogin(c.req.raw, await c.var.makeContext())) as any,
);

// ---------------------------------------------------------------------------
// /logout
// ---------------------------------------------------------------------------

api.openapi(
  createRoute({
    method: "post",
    path: "/logout",
    summary: "Log out the current session",
    responses: {
      200: { description: "Logged out", ...json(z.object({ ok: z.boolean() })) },
    },
  }),
  (async c => handleLogout(await c.var.makeContext())) as any,
);

// ---------------------------------------------------------------------------
// /song
// ---------------------------------------------------------------------------

api.openapi(
  createRoute({
    method: "post",
    path: "/song",
    summary: "Create a new song",
    request: {
      body: json(
        z
          .object({
            title: z.string(),
            author: z.string(),
            text: z.string().optional(),
            extraNonSearchable: z.string().optional(),
          })
          .openapi("CreateSongInput"),
      ),
    },
    responses: {
      200: { description: "Created", ...json(z.object({ slug: z.string() })) },
      400: { description: "Bad request", ...json(ErrorSchema) },
    },
  }),
  (async c => handleCreateSong(c.req.raw, await c.var.makeContext())) as any,
);

// ---------------------------------------------------------------------------
// /import (and legacy /ultimate-guitar alias)
// ---------------------------------------------------------------------------

const importRoute = createRoute({
  method: "get",
  path: "/import",
  summary: "Import a song from an external site (supermusic, ultimate-guitar, …)",
  request: {
    query: z.object({ url: z.string().url().openapi({ description: "Source URL to import from" }) }),
  },
  responses: {
    200: {
      description: "Imported song",
      ...json(z.object({ text: z.string(), author: z.string(), title: z.string() })),
    },
    400: { description: "Bad request", ...json(ErrorSchema) },
  },
});

api.openapi(importRoute, (async c => handleImport(c.req.raw)) as any);
api.get("/ultimate-guitar", c => handleImport(c.req.raw));

// ---------------------------------------------------------------------------
// /releases
// ---------------------------------------------------------------------------

api.openapi(
  createRoute({
    method: "get",
    path: "/releases",
    summary: "List published GitHub releases (changelog)",
    responses: {
      200: {
        description: "Releases",
        ...json(
          z.object({
            data: z.array(z.object({ name: z.string(), tagName: z.string(), body: z.string() })),
          }),
        ),
      },
    },
  }),
  (async c => handleReleases(c.req.raw)) as any,
);

// ---------------------------------------------------------------------------
// /rest/{operation} — thin GraphQL proxy
// ---------------------------------------------------------------------------

api.openapi(
  createRoute({
    method: "post",
    path: "/rest/{operation}",
    summary: "Execute a named GraphQL operation with the request body as variables",
    request: {
      params: z.object({ operation: z.string() }),
      body: json(z.object({}).passthrough().openapi("GraphQLVariables")),
    },
    responses: {
      200: {
        description: "GraphQL response",
        ...json(z.object({ data: z.any().optional(), errors: z.any().optional() })),
      },
      404: { description: "Unknown operation", content: { "text/plain": { schema: z.string() } } },
    },
  }),
  (async c => handleRest(c.req.param("operation"), c.req.raw, await c.var.makeContext())) as any,
);

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
