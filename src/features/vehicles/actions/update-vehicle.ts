"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { vehicles } from "@/db/schema";
import { authActionClient } from "@/lib/safe-action";
import { updateVehicleSchema } from "../schemas/vehicle-schema";

export const updateVehicleAction = authActionClient
	.inputSchema(updateVehicleSchema)
	.action(async ({ parsedInput }) => {
		const db = getDb();
		const [vehicle] = await db
			.update(vehicles)
			.set({ name: parsedInput.name, thumbnailUrl: parsedInput.thumbnailUrl || null })
			.where(eq(vehicles.id, parsedInput.id))
			.returning();

		revalidatePath("/vehicles");
		revalidatePath("/dashboard");
		revalidatePath("/fillups");
		revalidatePath("/statistics");

		return { vehicle };
	});
