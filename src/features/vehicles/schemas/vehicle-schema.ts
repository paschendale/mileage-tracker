import { z } from "zod";

const thumbnailUrl = z
	.string()
	.trim()
	.refine((v) => v === "" || /^https?:\/\//i.test(v), "Must be a valid URL starting with http(s)://");

export const vehicleSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(100),
	thumbnailUrl: thumbnailUrl.optional().default(""),
	tankCapacityLiters: z.number().positive().nullable().optional().default(null),
});

export const updateVehicleSchema = vehicleSchema.extend({
	id: z.number().int().positive(),
});

export const deleteVehicleSchema = z.object({
	id: z.number().int().positive(),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
