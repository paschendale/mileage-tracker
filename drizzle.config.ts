import type { Config } from "drizzle-kit";

// Migrations are generated offline (`drizzle-kit generate`) and applied via
// `wrangler d1 migrations apply`, so no live driver/credentials are needed here.
export default {
	schema: "./src/db/schema/index.ts",
	out: "./migrations",
	dialect: "sqlite",
} satisfies Config;
