import { SpendingBreakdownTables } from "@/features/statistics/components/spending-breakdown-tables";
import { StatisticsGrid } from "@/features/statistics/components/statistics-grid";
import { getStatisticsData } from "@/features/statistics/queries/get-statistics";
import { getSelectedVehicleContext } from "@/lib/selected-vehicle";

export default async function StatisticsPage() {
	const { selectedVehicle } = await getSelectedVehicleContext();

	if (!selectedVehicle) {
		return (
			<div className="p-6 md:p-8">
				<div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-24 text-center">
					<p className="font-medium">No vehicles yet</p>
					<p className="text-sm text-muted-foreground">Add a vehicle to see its statistics.</p>
				</div>
			</div>
		);
	}

	const data = await getStatisticsData(selectedVehicle);

	return (
		<div className="flex flex-col gap-6 p-6 md:p-8">
			<h1 className="text-2xl font-semibold tracking-tight">Statistics</h1>

			<StatisticsGrid data={data} />

			<SpendingBreakdownTables monthly={data.monthly} yearly={data.yearly} />
		</div>
	);
}
