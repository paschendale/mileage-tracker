"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { vehicles } from "@/db/schema";
import { authActionClient } from "@/lib/safe-action";
import { vehicleSchema } from "../schemas/vehicle-schema";

export const createVehicleAction = authActionClient.inputSchema(vehicleSchema).action(async ({ parsedInput }) => {
	const db = getDb();
	const [vehicle] = await db
		.insert(vehicles)
		.values({ name: parsedInput.name, thumbnailUrl: parsedInput.thumbnailUrl || null })
		.returning();

	revalidatePath("/vehicles");
	revalidatePath("/dashboard");
	revalidatePath("/fillups");
	revalidatePath("/statistics");

	return { vehicle };
});
