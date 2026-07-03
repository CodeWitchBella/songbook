import { createRoute, z } from "@hono/zod-openapi";
import { checkCode } from "#/db/drizzle.ts";
import { song } from "#/db/schema.ts";
import type { MyContext } from "#/lib/context.ts";
import { getViewerCheck } from "#/lib/auth.ts";
import { badRequestResponse, jsonResponse } from "#/lib/response.ts";
import { randomID, slugify } from "#/lib/utils.ts";
import { ErrorSchema, json, type Api } from "#/lib/openapi.ts";

export function registerCreateSong(api: Api) {
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
}

interface CreateSongInput {
  title: string;
  author: string;
  text?: string;
  extraNonSearchable?: string;
}

export async function handleCreateSong(input: CreateSongInput, context: MyContext): Promise<Response> {
  const { viewer } = await getViewerCheck(context);

  const slug = slugify(`${input.title}-${input.author}`);
  const idString = await randomID(20);
  try {
    await context.db.insert(song).values({
      text: input.text || "",
      idString,
      slug,
      editor: viewer.id,
      author: input.author,
      title: input.title,
    });
  } catch (e) {
    if (checkCode(e, "ER_DUP_ENTRY")) return badRequestResponse("Song already exists");
    throw e;
  }

  return jsonResponse({ slug });
}
