import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const vehicles = sqliteTable("vehicles", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	thumbnailUrl: text("thumbnail_url"),
	// Nullable: not every vehicle has this logged, and estimated-autonomy math
	// falls back to null (shown as "—") rather than a misleading guess when unset.
	tankCapacityLiters: real("tank_capacity_liters"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
