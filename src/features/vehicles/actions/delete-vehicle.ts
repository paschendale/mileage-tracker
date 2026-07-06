"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { fillUps, vehicles } from "@/db/schema";
import { authActionClient } from "@/lib/safe-action";
import { deleteVehicleSchema } from "../schemas/vehicle-schema";

export const deleteVehicleAction = authActionClient
	.inputSchema(deleteVehicleSchema)
	.action(async ({ parsedInput }) => {
		const db = getDb();

		// Explicit cascade rather than relying solely on the FK's ON DELETE
		// CASCADE, so this is correct even if D1's foreign_keys pragma is ever off.
		await db.delete(fillUps).where(eq(fillUps.vehicleId, parsedInput.id));
		await db.delete(vehicles).where(eq(vehicles.id, parsedInput.id));

		revalidatePath("/vehicles");
		revalidatePath("/dashboard");
		revalidatePath("/fillups");
		revalidatePath("/statistics");

		return { success: true as const };
	});
