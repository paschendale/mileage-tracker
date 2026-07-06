import { cookies } from "next/headers";
import { getVehicles } from "@/db/queries/vehicles";
import type { Vehicle } from "@/db/schema";
import { SELECTED_VEHICLE_COOKIE_NAME } from "@/lib/constants";

export interface SelectedVehicleContext {
	vehicles: Vehicle[];
	selectedVehicle: Vehicle | null;
}

/**
 * Resolves the selected vehicle from the mirrored cookie, falling back to the
 * first vehicle by createdAt if the cookie is missing, stale, or points at a
 * vehicle that no longer exists. Returns the full vehicle list too since the
 * top nav's switcher and this resolution share the same query.
 */
export async function getSelectedVehicleContext(): Promise<SelectedVehicleContext> {
	const vehicles = await getVehicles();
	if (vehicles.length === 0) {
		return { vehicles, selectedVehicle: null };
	}

	const cookieStore = await cookies();
	const selectedId = Number(cookieStore.get(SELECTED_VEHICLE_COOKIE_NAME)?.value);
	const selectedVehicle = vehicles.find((v) => v.id === selectedId) ?? vehicles[0]!;

	return { vehicles, selectedVehicle };
}

export async function getSelectedVehicleId(): Promise<number | null> {
	const { selectedVehicle } = await getSelectedVehicleContext();
	return selectedVehicle?.id ?? null;
}
