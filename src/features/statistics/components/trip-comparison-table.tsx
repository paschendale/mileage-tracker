import { ComparisonTable } from "@/components/comparison-table";
import { TRIP_TYPES, type TripType } from "@/db/schema";
import type { TripStatistics } from "../queries/get-statistics";

const TRIP_LABELS: Record<TripType, string> = { road: "Road", city: "City" };
const TRIP_COLUMNS = TRIP_TYPES.map((tripType) => ({ key: tripType, label: TRIP_LABELS[tripType] }));

export function TripComparisonTable({ perTripType }: { perTripType: Record<TripType, TripStatistics> }) {
	return (
		<ComparisonTable
			title="Road vs. city"
			columns={TRIP_COLUMNS}
			data={perTripType}
			lowConfidenceNoun="leg"
		/>
	);
}
