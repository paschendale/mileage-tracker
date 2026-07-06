"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { fillUps } from "@/db/schema";
import { authActionClient } from "@/lib/safe-action";
import { revalidateFillUpPaths } from "../lib/revalidate";
import { deleteFillUpSchema } from "../schemas/fillup-schema";

export const deleteFillUpAction = authActionClient
	.inputSchema(deleteFillUpSchema)
	.action(async ({ parsedInput }) => {
		const db = getDb();
		await db.delete(fillUps).where(eq(fillUps.id, parsedInput.id));

		revalidateFillUpPaths();

		return { success: true as const };
	});
