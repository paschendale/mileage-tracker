import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vehicles, type Vehicle } from "@/db/schema";

export async function getVehicles(): Promise<Vehicle[]> {
	const db = getDb();
	return db.select().from(vehicles).orderBy(asc(vehicles.createdAt));
}

export async function getVehicleById(id: number): Promise<Vehicle | undefined> {
	const db = getDb();
	const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
	return vehicle;
}
