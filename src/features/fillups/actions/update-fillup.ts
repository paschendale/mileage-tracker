"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { fillUps } from "@/db/schema";
import { authActionClient } from "@/lib/safe-action";
import { revalidateFillUpPaths } from "../lib/revalidate";
import { updateFillUpSchema } from "../schemas/fillup-schema";

export const updateFillUpAction = authActionClient
	.inputSchema(updateFillUpSchema)
	.action(async ({ parsedInput }) => {
		const db = getDb();
		const [fillUp] = await db
			.update(fillUps)
			.set({
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
			.where(eq(fillUps.id, parsedInput.id))
			.returning();

		revalidateFillUpPaths();

		return { fillUp };
	});
