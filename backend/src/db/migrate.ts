import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";

import { sql } from "drizzle-orm";

import { drizzle } from "#/db/drizzle.ts";

// Runs drizzle-kit's `push` (same as `pnpm db-push`) to sync the schema on startup.
export function migrate() {
  if (!process.env.POSTGRESQL_URL) throw new Error("Missing POSTGRESQL_URL env");

  const require = createRequire(import.meta.url);
  const cli = join(require.resolve("drizzle-kit"), "..", "bin.cjs");
  const config = join(import.meta.dirname, "../../drizzle.config.ts");

  console.info("Running database migration (drizzle-kit push)…");
  const result = spawnSync(process.execPath, [cli, "push", "--config", config, "--force"], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`Database migration failed (drizzle-kit push exited with ${result.status ?? result.signal})`);
  }
  console.info("Database migration complete.");
}

const PAGE_BREAK = "\n--- page break ---\n";

// Data migration: the old page-break marker is no longer used by the renderer,
// so collapse it into a plain newline. Idempotent, so it can run on every boot.
export async function migrateData() {
  const db = drizzle();
  const result = await db.execute(sql`
    update "song"
      set "text" = replace("text", ${PAGE_BREAK}, ${"\n"}),
          "last_modified" = CURRENT_TIMESTAMP
      where position(${PAGE_BREAK} in "text") > 0
  `);
  const count = (result as unknown as { count?: number }).count ?? 0;
  if (count > 0) console.info(`Removed page break markers from ${count} song(s).`);
}
