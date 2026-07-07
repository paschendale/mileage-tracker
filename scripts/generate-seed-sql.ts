import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

interface SourceFillUp {
	date: string;
	odometer_km: number;
	cost_brl: number;
	liters: number;
	fuel_type: string;
	note?: string;
	// Present in data.json but always dropped: consumption is never trusted
	// from import, only ever derived by the app itself.
	distance_since_last_km?: number | null;
	consumption_km_per_l?: number | null;
}

const SEED_VEHICLE_NAME = "HRV";
const SEED_VEHICLE_TANK_CAPACITY_LITERS = 50;

// data.json uses "alcohol"; the app's fuelType enum uses "ethanol".
const FUEL_TYPE_MAP: Record<string, string> = {
	alcohol: "ethanol",
};

function sqlString(value: string | null): string {
	if (value === null) return "NULL";
	return `'${value.replace(/'/g, "''")}'`;
}

function main() {
	const dataPath = resolve(process.cwd(), "data.json");
	const entries = JSON.parse(readFileSync(dataPath, "utf-8")) as SourceFillUp[];

	const vehicleIdSubquery = `(SELECT id FROM vehicles WHERE name = ${sqlString(SEED_VEHICLE_NAME)})`;
	const statements: string[] = [];

	statements.push(
		`INSERT INTO vehicles (name, thumbnail_url, tank_capacity_liters)\nSELECT ${sqlString(SEED_VEHICLE_NAME)}, NULL, ${SEED_VEHICLE_TANK_CAPACITY_LITERS}\nWHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE name = ${sqlString(SEED_VEHICLE_NAME)});`,
	);

	for (const entry of entries) {
		const fuelType = FUEL_TYPE_MAP[entry.fuel_type] ?? entry.fuel_type;
		const notes = entry.note ?? null;

		// Idempotent per-row on (vehicle, odometer_km): odometer readings are
		// monotonic and unique per vehicle, so re-running this script only
		// inserts rows that don't already exist rather than duplicating everything.
		statements.push(
			[
				"INSERT INTO fill_ups (vehicle_id, date, odometer_km, liters, total_price, fuel_type, is_full_tank, notes)",
				`SELECT ${vehicleIdSubquery}, ${sqlString(entry.date)}, ${entry.odometer_km}, ${entry.liters}, ${entry.cost_brl}, ${sqlString(fuelType)}, 1, ${sqlString(notes)}`,
				`WHERE NOT EXISTS (SELECT 1 FROM fill_ups WHERE vehicle_id = ${vehicleIdSubquery} AND odometer_km = ${entry.odometer_km});`,
			].join("\n"),
		);
	}

	const outPath = resolve(process.cwd(), "scripts/seed.sql");
	writeFileSync(outPath, `${statements.join("\n\n")}\n`);
	console.log(`Wrote ${entries.length} fill-up insert statements to ${outPath}`);
}

main();
