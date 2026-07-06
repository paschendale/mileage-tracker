import { VehicleSwitcher } from "@/features/vehicles/components/vehicle-switcher";
import type { Vehicle } from "@/db/schema";

export function TopNav({ vehicles, selectedVehicle }: { vehicles: Vehicle[]; selectedVehicle: Vehicle | null }) {
	return (
		<header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
			<span className="text-base font-semibold tracking-tight md:hidden">Mileage Tracker</span>
			<div className="flex-1" />
			<VehicleSwitcher vehicles={vehicles} selectedVehicle={selectedVehicle} />
		</header>
	);
}
