import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { fillUps, type FillUp } from "@/db/schema";

export async function getFillUpsByVehicleId(vehicleId: number): Promise<FillUp[]> {
	const db = getDb();
	return db.select().from(fillUps).where(eq(fillUps.vehicleId, vehicleId));
}
