import { BASIC_COMPARISON_METRIC_ROWS, ComparisonTable } from "@/components/comparison-table";
import { FUEL_TYPES, type FuelType } from "@/db/schema";
import type { FuelTypeStats } from "@/services/fuel-comparison";

const FUEL_LABELS: Record<FuelType, string> = { gasoline: "Gasoline", ethanol: "Ethanol" };
const FUEL_COLUMNS = FUEL_TYPES.map((fuelType) => ({ key: fuelType, label: FUEL_LABELS[fuelType] }));

export function FuelComparisonTable({ perFuel }: { perFuel: Record<FuelType, FuelTypeStats> }) {
	return (
		<ComparisonTable
			title="Gasoline vs. ethanol"
			columns={FUEL_COLUMNS}
			data={perFuel}
			metricRows={BASIC_COMPARISON_METRIC_ROWS}
			lowConfidenceNoun="interval"
		/>
	);
}
