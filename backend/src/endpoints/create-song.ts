import { checkCode } from "../db/drizzle.ts";
import { song } from "../db/schema.ts";
import type { MyContext } from "../lib/context.ts";
import { getViewerCheck } from "../lib/graphql-server-config.ts";
import { validateJsonBody } from "../lib/request.ts";
import {
  badRequestResponse,
  jsonResponse,
  methodNotAllowedResponse,
} from "../lib/response.ts";
import { randomID, slugify } from "../lib/utils.ts";

export async function handleCreateSong(request: Request, context: MyContext) {
  const { viewer } = await getViewerCheck(context);
  if (request.method !== "POST") return methodNotAllowedResponse();
  const input = await validateJsonBody(request, {
    required: ["title", "author"],
    optional: ["text", "extraNonSearchable"],
  });

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
    if (checkCode(e, "ER_DUP_ENTRY"))
      return badRequestResponse("Song already exists");
    throw e;
  }

  return jsonResponse({ slug });
}
