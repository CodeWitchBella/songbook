import { MyContext } from "../lib/context";
import {
  firestoreDoc,
  queryFieldEqualsSingle,
  serverTimestamp,
} from "../lib/firestore";
import { parseJsonBody } from "../lib/request";
import {
  badRequestResponse,
  jsonResponse,
  methodNotAllowedResponse,
} from "../lib/response";
import { getViewerCheck } from "../lib/server-config";
import { randomID, slugify } from "../lib/utils";

export async function handleCreateSong(request: Request, context: MyContext) {
  const { viewer } = await getViewerCheck(context);
  if (request.method !== "post") return methodNotAllowedResponse();
  const { title, author, text = "" } = await parseJsonBody(request);

  if (!title || !author) {
    return badRequestResponse("Title and author are required");
  }
  if (
    typeof title !== "string" ||
    typeof author !== "string" ||
    typeof text !== "string"
  ) {
    return badRequestResponse("Title, author and text must be strings");
  }

  const slug = slugify(`${title}-${author}`);
  const existing = await queryFieldEqualsSingle("songs", "slug", slug);
  if (existing !== null) return badRequestResponse("Song already exists");
  const doc = firestoreDoc("songs/" + (await randomID(20)));
  if (await doc.get()) throw new Error("Generated coliding id");
  await doc.set(
    {
      title,
      author,
      deleted: false,
      slug,
      text,
      editor: viewer.id,
      insertedAt: serverTimestamp(),
      lastModified: serverTimestamp(),
    },
    { merge: false },
  );
  const res = await doc.get();
  return jsonResponse({ doc: res });
}
