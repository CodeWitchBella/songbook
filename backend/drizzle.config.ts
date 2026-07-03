import path from "node:path";

import type { Config } from "drizzle-kit";

const schema = path.join(__dirname, "src/db/schema.ts");
const config = {
  schema,
  dialect: "postgresql",
  verbose: true,
  dbCredentials: {
    url: process.env.POSTGRESQL_URL!,
  },
} satisfies Config;
export default config;
