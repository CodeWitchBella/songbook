import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";

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
