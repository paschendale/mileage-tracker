import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
	const { env } = getCloudflareContext();
	return drizzle(env.mileage_tracker_db, { schema });
}

export type Db = ReturnType<typeof getDb>;
