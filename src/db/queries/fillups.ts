import { count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { fillUps, type FillUp } from "@/db/schema";

export async function getFillUpsByVehicleId(vehicleId: number): Promise<FillUp[]> {
	const db = getDb();
	return db.select().from(fillUps).where(eq(fillUps.vehicleId, vehicleId));
}

export async function getFillUpCountsByVehicle(): Promise<Record<number, number>> {
	const db = getDb();
	const rows = await db
		.select({ vehicleId: fillUps.vehicleId, count: count() })
		.from(fillUps)
		.groupBy(fillUps.vehicleId);
	return Object.fromEntries(rows.map((r) => [r.vehicleId, r.count]));
}
