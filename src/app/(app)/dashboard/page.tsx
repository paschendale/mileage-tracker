import { StatCard } from "@/components/stat-card";
import { ChartsSection } from "@/features/dashboard/components/charts-section";
import { FuelRecommendation } from "@/features/dashboard/components/fuel-recommendation";
import { FuelSwitcherView } from "@/features/dashboard/components/fuel-switcher-view";
import { getDashboardData } from "@/features/dashboard/lib/get-dashboard-data";
import { RecentFillUpsTable } from "@/features/dashboard/components/recent-fillups-table";
import { VehicleThumbnail } from "@/features/vehicles/components/vehicle-thumbnail";
import { getSelectedVehicleContext } from "@/lib/selected-vehicle";

export default async function DashboardPage() {
	const { selectedVehicle } = await getSelectedVehicleContext();

	if (!selectedVehicle) {
		return (
			<div className="p-6 md:p-8">
				<div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-24 text-center">
					<p className="font-medium">No vehicles yet</p>
					<p className="text-sm text-muted-foreground">Add a vehicle to start seeing your dashboard.</p>
				</div>
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

			<FuelRecommendation perFuel={data.perFuel} />

			<FuelSwitcherView fillUps={data.fillUps} perFuel={data.perFuel} defaultFuelType={data.lastFillUpFuelType} />

			<ChartsSection fillUps={data.fillUps} />

			<div>
				<h2 className="mb-3 text-lg font-semibold tracking-tight">Recent fill-ups</h2>
				<RecentFillUpsTable fillUps={data.fillUps} />
			</div>
		</div>
	);
}
