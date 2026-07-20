import { Car } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { FuelComparisonTable } from "@/features/statistics/components/fuel-comparison-table";
import { SpendingBreakdownTables } from "@/features/statistics/components/spending-breakdown-tables";
import { StatisticsChartsSection } from "@/features/statistics/components/statistics-charts-section";
import { StatisticsGrid } from "@/features/statistics/components/statistics-grid";
import { TripComparisonTable } from "@/features/statistics/components/trip-comparison-table";
import { getStatisticsData } from "@/features/statistics/queries/get-statistics";
import { getSelectedVehicleContext } from "@/lib/selected-vehicle";

export default async function StatisticsPage() {
	const { selectedVehicle } = await getSelectedVehicleContext();

	if (!selectedVehicle) {
		return (
			<div className="p-6 md:p-8">
				<EmptyState icon={Car} title="No vehicles yet" description="Add a vehicle to see its statistics." />
			</div>
		);
	}

	const data = await getStatisticsData(selectedVehicle);

	return (
		<div className="flex flex-col gap-6 p-6 md:p-8">
			<h1 className="text-2xl font-semibold tracking-tight">Statistics</h1>

			<StatisticsGrid data={data} />

			<FuelComparisonTable perFuel={data.perFuel} />

			<TripComparisonTable perTripType={data.perTripType} />

			<StatisticsChartsSection priceTrend={data.priceTrend} />

			<SpendingBreakdownTables monthly={data.monthly} yearly={data.yearly} />
		</div>
	);
}
