import { Car } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { TRIP_TYPES } from "@/db/schema";
import { ChartsSection } from "@/features/dashboard/components/charts-section";
import { DashboardChartsSection } from "@/features/dashboard/components/dashboard-charts-section";
import { FuelComparisonTable } from "@/features/dashboard/components/fuel-comparison-table";
import { FuelRecommendation } from "@/features/dashboard/components/fuel-recommendation";
import { TripComparisonTable } from "@/features/dashboard/components/trip-comparison-table";
import { getDashboardData } from "@/features/dashboard/lib/get-dashboard-data";
import { RecentFillUpsTable } from "@/features/dashboard/components/recent-fillups-table";
import { VehicleThumbnail } from "@/features/vehicles/components/vehicle-thumbnail";
import { getSelectedVehicleContext } from "@/lib/selected-vehicle";

export default async function DashboardPage() {
	const { selectedVehicle } = await getSelectedVehicleContext();

	if (!selectedVehicle) {
		return (
			<div className="p-6 md:p-8">
				<EmptyState
					icon={Car}
					title="No vehicles yet"
					description="Add a vehicle to start seeing your dashboard."
				/>
			</div>
		);
	}

	const data = await getDashboardData(selectedVehicle);

	return (
		<div className="flex flex-col gap-6 p-6 md:p-8">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<VehicleThumbnail vehicle={data.vehicle} className="size-12" />
					<h1 className="text-2xl font-semibold tracking-tight">{data.vehicle.name}</h1>
				</div>
				<StatCard
					label="Days since last fill-up"
					value={data.daysSinceLastFillUp !== null ? String(data.daysSinceLastFillUp) : "—"}
					className="w-40"
				/>
			</div>

			{TRIP_TYPES.map((tripType) => (
				<FuelRecommendation key={tripType} tripType={tripType} perFuel={data.perFuelByTripType[tripType]} />
			))}

			<FuelComparisonTable perFuel={data.perFuel} />

			<TripComparisonTable perTripType={data.perTripType} />

			<DashboardChartsSection fillUps={data.fillUps} />

			<ChartsSection fillUps={data.fillUps} />

			<div>
				<h2 className="mb-3 text-lg font-semibold tracking-tight">Recent fill-ups</h2>
				<RecentFillUpsTable fillUps={data.fillUps} />
			</div>
		</div>
	);
}
