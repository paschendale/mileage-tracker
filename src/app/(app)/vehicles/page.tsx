import { getVehicles } from "@/db/queries/vehicles";
import { getFillUpCountsByVehicle } from "@/db/queries/fillups";
import { AddVehicleButton } from "@/features/vehicles/components/add-vehicle-button";
import { VehicleCard } from "@/features/vehicles/components/vehicle-card";

export default async function VehiclesPage() {
	const [vehicles, fillUpCounts] = await Promise.all([getVehicles(), getFillUpCountsByVehicle()]);

	return (
		<div className="p-6 md:p-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-semibold tracking-tight">Vehicles</h1>
				<AddVehicleButton />
			</div>

			{vehicles.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-24 text-center">
					<p className="font-medium">No vehicles yet</p>
					<p className="text-sm text-muted-foreground">Add a vehicle to start tracking fill-ups.</p>
				</div>
			) : (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
					{vehicles.map((vehicle) => (
						<VehicleCard key={vehicle.id} vehicle={vehicle} fillUpCount={fillUpCounts[vehicle.id] ?? 0} />
					))}
				</div>
			)}
		</div>
	);
}
