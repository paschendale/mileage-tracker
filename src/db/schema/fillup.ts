import { sql } from "drizzle-orm";
import { check, index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { vehicles } from "./vehicle";

export const FUEL_TYPES = ["gasoline", "ethanol"] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const TRIP_TYPES = ["road", "city"] as const;
export type TripType = (typeof TRIP_TYPES)[number];

export const fillUps = sqliteTable(
	"fill_ups",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		vehicleId: integer("vehicle_id")
			.notNull()
			.references(() => vehicles.id, { onDelete: "cascade" }),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
		// Plain ISO 'YYYY-MM-DD' date, no time component: the user only ever
		// picks a calendar day, and lexical sort == chronological sort for this
		// format, which sidesteps timezone conversion bugs entirely.
		date: text("date").notNull(),
		odometerKm: integer("odometer_km").notNull(),
		liters: real("liters").notNull(),
		totalPrice: real("total_price").notNull(),
		fuelType: text("fuel_type", { enum: FUEL_TYPES }).notNull(),
		isFullTank: integer("is_full_tank", { mode: "boolean" }).notNull().default(true),
		// NOT NULL with a 'city' default — a backfill safety net for historical
		// rows (migration 0004), not a UX default; the form still requires an
		// explicit choice for every new/edited fill-up (see fillup-schema.ts).
		tripType: text("trip_type", { enum: TRIP_TYPES }).notNull().default("city"),
		notes: text("notes"),
	},
	(table) => [
		index("fill_ups_vehicle_id_idx").on(table.vehicleId),
		index("fill_ups_date_idx").on(table.date),
		index("fill_ups_odometer_km_idx").on(table.odometerKm),
		// The actual hot access pattern is "all fill-ups for vehicle X ordered by odometer".
		index("fill_ups_vehicle_odometer_idx").on(table.vehicleId, table.odometerKm),
		check("fill_ups_fuel_type_check", sql`${table.fuelType} in ('gasoline','ethanol')`),
		check("fill_ups_trip_type_check", sql`${table.tripType} in ('road','city')`),
	],
);

export type FillUp = typeof fillUps.$inferSelect;
export type NewFillUp = typeof fillUps.$inferInsert;
