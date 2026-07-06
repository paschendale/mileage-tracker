"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SELECTED_VEHICLE_COOKIE_NAME, SELECTED_VEHICLE_STORAGE_KEY } from "@/lib/constants";

/**
 * Reconciles localStorage (the spec's source of truth for vehicle selection)
 * against the cookie the server actually used to render this request. Runs
 * once per resolved id: if localStorage has no preference yet, it adopts the
 * server's default; if it disagrees with a stale cookie, it corrects the
 * cookie and refreshes once so subsequent renders reflect it.
 */
export function VehicleContextSync({ selectedVehicleId }: { selectedVehicleId: number | null }) {
	const router = useRouter();

	useEffect(() => {
		if (selectedVehicleId === null) return;

		const stored = localStorage.getItem(SELECTED_VEHICLE_STORAGE_KEY);
		const storedId = stored ? Number(stored) : null;

		if (storedId === null) {
			localStorage.setItem(SELECTED_VEHICLE_STORAGE_KEY, String(selectedVehicleId));
			return;
		}

		if (storedId !== selectedVehicleId) {
			document.cookie = `${SELECTED_VEHICLE_COOKIE_NAME}=${storedId}; path=/; max-age=${60 * 60 * 24 * 365}`;
			router.refresh();
		}
	}, [selectedVehicleId, router]);

	return null;
}
