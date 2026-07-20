import { BASIC_COMPARISON_METRIC_ROWS, ComparisonTable } from "@/components/comparison-table";
import { TRIP_TYPES, type TripType } from "@/db/schema";
import type { TripTypeStats } from "@/services/trip-comparison";

const TRIP_LABELS: Record<TripType, string> = { road: "Road", city: "City" };
const TRIP_COLUMNS = TRIP_TYPES.map((tripType) => ({ key: tripType, label: TRIP_LABELS[tripType] }));

export function TripComparisonTable({ perTripType }: { perTripType: Record<TripType, TripTypeStats> }) {
	return (
		<ComparisonTable
			title="Road vs. city"
			columns={TRIP_COLUMNS}
			data={perTripType}
			metricRows={BASIC_COMPARISON_METRIC_ROWS}
			lowConfidenceNoun="leg"
		/>
	);
}
