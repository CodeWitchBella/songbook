import { eq, sql } from "drizzle-orm";

import { affectedRows, schema } from "#/db/drizzle.ts";
import type { MyContext } from "#/lib/context.ts";
import { RestError } from "#/lib/auth.ts";
import { slugify } from "#/lib/utils.ts";

export async function updateSong(vars: any, context: MyContext) {
  const { id, input } = vars as { id: string; input: any };
  const res = await context.db
    .update(schema.song)
    .set({
      author: input.author ?? undefined,
      title: input.title ?? undefined,
      text: input.text ?? undefined,
      fontSize: input.fontSize ?? undefined,
      paragraphSpace: input.paragraphSpace ?? undefined,
      titleSpace: input.titleSpace ?? undefined,
      spotify: input.spotify ?? undefined,
      pretranspose: input.pretranspose ?? undefined,
      extraSearchable: input.extraSearchable ?? undefined,
      extraNonSearchable: input.extraNonSearchable ?? undefined,
      slug: input.author && input.title ? slugify(`${input.title}-${input.author}`) : undefined,
      lastModified: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(schema.song.idString, id));
  if (!affectedRows(res)) throw new RestError("Song does not exist");

  const value = await context.db.query.song.findFirst({ where: eq(schema.song.idString, id) });
  if (!value) throw new RestError("Song does not exist");
  return { updateSong: { id: value.idString } };
}
