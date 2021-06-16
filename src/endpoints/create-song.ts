import { MyContext } from "../lib/context";
import {
  firestoreDoc,
  queryFieldEqualsSingle,
  serverTimestamp,
} from "../lib/firestore";
import { parseJsonBody, validateJsonBody } from "../lib/request";
import {
  badRequestResponse,
  jsonResponse,
  methodNotAllowedResponse,
} from "../lib/response";
import { getViewerCheck } from "../lib/server-config";
import { randomID, slugify } from "../lib/utils";

export async function handleCreateSong(request: Request, context: MyContext) {
  const { viewer } = await getViewerCheck(context);
  if (request.method !== "POST") return methodNotAllowedResponse();
  const input = await validateJsonBody(request, {
    required: ["title", "author"],
    optional: ["text", "extraNonSearchable"],
  });

  const slug = slugify(`${input.title}-${input.author}`);
  const existing = await queryFieldEqualsSingle("songs", "slug", slug);
  if (existing !== null) return badRequestResponse("Song already exists");
  const doc = firestoreDoc("songs/" + (await randomID(20)));
  if (await doc.get()) throw new Error("Generated coliding id");
  await doc.set(
    {
      ...input,
      text: input.text || "",
      deleted: false,
      slug,
      editor: viewer.id,
      insertedAt: serverTimestamp(),
      lastModified: serverTimestamp(),
    },
    { merge: false },
  );
  return jsonResponse({ slug });
}
