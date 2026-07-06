"use client";

import { ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SELECTED_VEHICLE_COOKIE_NAME, SELECTED_VEHICLE_STORAGE_KEY } from "@/lib/constants";
import type { Vehicle } from "@/db/schema";
import { VehicleThumbnail } from "./vehicle-thumbnail";

export function selectVehicle(vehicleId: number) {
	document.cookie = `${SELECTED_VEHICLE_COOKIE_NAME}=${vehicleId}; path=/; max-age=${60 * 60 * 24 * 365}`;
	localStorage.setItem(SELECTED_VEHICLE_STORAGE_KEY, String(vehicleId));
}

export function VehicleSwitcher({
	vehicles,
	selectedVehicle,
}: {
	vehicles: Vehicle[];
	selectedVehicle: Vehicle | null;
}) {
	const router = useRouter();

	if (!selectedVehicle) {
		return <span className="text-sm text-muted-foreground">No vehicles yet</span>;
	}

	function handleSelect(vehicle: Vehicle) {
		if (vehicle.id === selectedVehicle?.id) return;
		selectVehicle(vehicle.id);
		router.refresh();
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors hover:bg-muted">
				<VehicleThumbnail vehicle={selectedVehicle} />
				{selectedVehicle.name}
				<ChevronsUpDown className="size-3.5 text-muted-foreground" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{vehicles.map((vehicle) => (
					<DropdownMenuItem key={vehicle.id} onSelect={() => handleSelect(vehicle)} className="gap-2">
						<VehicleThumbnail vehicle={vehicle} />
						{vehicle.name}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
