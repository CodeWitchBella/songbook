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
  const {
    title,
    author,
    text = "",
    extraNonSearchable = "",
  } = await parseJsonBody(request);

  if (!title || !author) {
    return badRequestResponse("Title and author are required");
  }
  if (
    typeof title !== "string" ||
    typeof author !== "string" ||
    typeof text !== "string" ||
    typeof extraNonSearchable !== "string"
  ) {
    return badRequestResponse("All fields must be strings");
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
      extraNonSearchable,
      insertedAt: serverTimestamp(),
      lastModified: serverTimestamp(),
    },
    { merge: false },
  );
  const res = await doc.get();
  if (!res) throw new Error("Song creation failed");
  const data = res.data();
  return jsonResponse({ id: res.id, slug: data.slug });
}
