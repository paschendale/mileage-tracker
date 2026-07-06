import { z } from "zod";
import { FUEL_TYPES } from "@/db/schema";

export const fillUpSchema = z.object({
	vehicleId: z.number().int().positive(),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
	odometerKm: z.number().int().nonnegative("Odometer must be zero or greater"),
	fuelType: z.enum(FUEL_TYPES),
	liters: z.number().positive("Liters must be greater than zero"),
	totalPrice: z.number().positive("Total price must be greater than zero"),
	isFullTank: z.boolean(),
	notes: z.string().trim().optional(),
});

export const updateFillUpSchema = fillUpSchema.extend({
	id: z.number().int().positive(),
});

export const deleteFillUpSchema = z.object({
	id: z.number().int().positive(),
});

export type FillUpInput = z.infer<typeof fillUpSchema>;
export type UpdateFillUpInput = z.infer<typeof updateFillUpSchema>;
