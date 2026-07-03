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
  (async (c: any) => handleLogin(c.req.valid("json"), await c.var.makeContext())) as any,
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
  (async (c: any) => handleLogout(await c.var.makeContext())) as any,
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
  (async (c: any) => handleCreateSong(c.req.valid("json"), await c.var.makeContext())) as any,
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

api.openapi(importRoute, (async (c: any) => handleImport(c.req.raw)) as any);
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
  (async (c: any) => handleReleases(c.req.raw)) as any,
);

// ---------------------------------------------------------------------------
// /{operation} — one fully-typed route each so the OpenAPI document describes
// every call's variables and response. Bodies are the operation's arguments;
// responses are the GraphQL-style `{ data, errors }` envelope. The handlers talk
// to the database directly — see `#/endpoints/rest.ts`.
// ---------------------------------------------------------------------------

const PictureSchema = z
  .object({ url: z.string(), width: z.number(), height: z.number() })
  .openapi("Picture");

const RestUserSchema = z
  .object({
    name: z.string().nullable(),
    admin: z.boolean(),
    handle: z.string().nullable(),
    picture: PictureSchema.nullable(),
  })
  .openapi("RestUser");

const SongDataSchema = z
  .object({
    slug: z.string(),
    author: z.string(),
    title: z.string(),
    text: z.string().nullable(),
    fontSize: z.number().nullable(),
    paragraphSpace: z.number().nullable(),
    titleSpace: z.number().nullable(),
    spotify: z.string().nullable(),
    pretranspose: z.number().nullable(),
    extraSearchable: z.string().nullable(),
    extraNonSearchable: z.string().nullable(),
    editor: RestUserSchema.nullable(),
    insertedAt: z.string().nullable(),
  })
  .openapi("SongData");

const SongRecordSchema = z
  .object({ id: z.string(), lastModified: z.string().nullable(), data: SongDataSchema })
  .openapi("SongRecord");

const CollectionDataSchema = z
  .object({
    slug: z.string(),
    name: z.string(),
    owner: RestUserSchema.nullable(),
    songList: z.array(z.object({ id: z.string() })),
    insertedAt: z.string().nullable(),
    locked: z.boolean().nullable(),
  })
  .openapi("CollectionData");

const CollectionRecordSchema = z
  .object({
    __typename: z.string(),
    id: z.string(),
    lastModified: z.string().nullable().optional(),
    data: CollectionDataSchema.optional(),
  })
  .openapi("CollectionRecord");

const GraphQLErrorSchema = z
  .object({ message: z.string() })
  .passthrough()
  .openapi("GraphQLError");

function restResponse<T extends z.ZodTypeAny>(data: T) {
  return z.object({ data: data.optional(), errors: z.array(GraphQLErrorSchema).optional() });
}

function restRoute<B extends z.ZodTypeAny, D extends z.ZodTypeAny>(
  operation: string,
  opts: { summary: string; body: B; data: D },
) {
  api.openapi(
    createRoute({
      method: "post",
      path: `/${operation}`,
      summary: opts.summary,
      request: { body: json(opts.body) },
      responses: {
        200: { description: "GraphQL response", ...json(restResponse(opts.data)) },
        404: { description: "Unknown operation", content: { "text/plain": { schema: z.string() } } },
      },
    }),
    (async (c: any) => handleRest(operation, c.req.valid("json"), await c.var.makeContext())) as any,
  );
}

restRoute("register", {
  summary: "Register a new user",
  body: z
    .object({
      input: z.object({ email: z.string(), password: z.string(), name: z.string() }),
    })
    .openapi("RegisterVariables"),
  data: z.object({
    register: z.object({
      __typename: z.string(),
      message: z.string().optional(),
      user: RestUserSchema.optional(),
    }),
  }),
});

restRoute("songs", {
  summary: "List songs modified after a given timestamp",
  body: z
    .object({
      modifiedAfter: z.string().nullable().optional(),
      deletedAfter: z.string(),
      skipDeleted: z.boolean(),
    })
    .openapi("SongsVariables"),
  data: z.object({
    songs: z.array(SongRecordSchema),
    viewer: RestUserSchema.nullable(),
    deletedSongs: z.array(z.string()).optional(),
  }),
});

restRoute("update-song", {
  summary: "Update a song",
  body: z
    .object({ id: z.string(), input: z.object({}).passthrough() })
    .openapi("UpdateSongVariables"),
  data: z.object({ updateSong: z.object({ id: z.string() }) }),
});

restRoute("collections", {
  summary: "List collections modified after a given timestamp",
  body: z.object({ modifiedAfter: z.string().nullable().optional() }).openapi("CollectionsVariables"),
  data: z.object({ collections: z.array(CollectionRecordSchema) }),
});

restRoute("add-to-collection", {
  summary: "Add a song to a collection",
  body: z.object({ collection: z.string(), song: z.string() }).openapi("AddToCollectionVariables"),
  data: z.object({ addToCollection: z.string().nullable() }),
});

restRoute("remove-from-collection", {
  summary: "Remove a song from a collection",
  body: z.object({ collection: z.string(), song: z.string() }).openapi("RemoveFromCollectionVariables"),
  data: z.object({ removeFromCollection: z.string().nullable() }),
});

restRoute("create-collection", {
  summary: "Create a new collection",
  body: z.object({ name: z.string() }).openapi("CreateCollectionVariables"),
  data: z.object({ createCollection: z.object({ id: z.string() }) }),
});

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
