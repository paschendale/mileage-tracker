"use server";

import { getDb } from "@/db";
import { fillUps } from "@/db/schema";
import { authActionClient } from "@/lib/safe-action";
import { revalidateFillUpPaths } from "../lib/revalidate";
import { fillUpSchema } from "../schemas/fillup-schema";

export const createFillUpAction = authActionClient.inputSchema(fillUpSchema).action(async ({ parsedInput }) => {
	const db = getDb();
	const [fillUp] = await db
		.insert(fillUps)
		.values({
			vehicleId: parsedInput.vehicleId,
			date: parsedInput.date,
			odometerKm: parsedInput.odometerKm,
			liters: parsedInput.liters,
			totalPrice: parsedInput.totalPrice,
			fuelType: parsedInput.fuelType,
			tripType: parsedInput.tripType,
			isFullTank: parsedInput.isFullTank,
			notes: parsedInput.notes || null,
		})
		.returning();

	revalidateFillUpPaths();

	return { fillUp };
});
