import path from "node:path";

import type { Config } from "drizzle-kit";

const schema = path.join(__dirname, "src/db/schema.ts");
const config = {
  schema,
  driver: "pg",
  verbose: true,
  dbCredentials: {
    connectionString: process.env.POSTGRESQL_URL!,
  },
} satisfies Config;
export default config;
