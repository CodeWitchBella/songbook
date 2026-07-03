import { writeFile } from "node:fs/promises";

import { api } from "#/app.ts";

/**
 * Emit the OpenAPI 3.1 document generated from the zod route schemas. Writes to
 * the path given as the first CLI argument, or stdout when none is provided.
 * Used by the frontend to regenerate its typed client (see `pnpm gen:api`).
 */
const doc = api.getOpenAPI31Document({
  openapi: "3.1.0",
  info: { title: "Songbook API", version: "1.0.0" },
});
const json = JSON.stringify(doc, null, 2);

const out = process.argv[2];
if (out) {
  await writeFile(out, json + "\n");
} else {
  process.stdout.write(json);
}
