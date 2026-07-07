import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FUEL_TYPES, type FuelType } from "@/db/schema";
import { formatCurrency, formatNumber } from "@/lib/format";
import { CONFIDENCE_THRESHOLDS } from "@/services/fuel-comparison";
import type { FuelStatistics } from "../queries/get-statistics";

const FUEL_LABELS: Record<FuelType, string> = { gasoline: "Gasoline", ethanol: "Ethanol" };

interface MetricRow {
	label: string;
	format: (stats: FuelStatistics) => string;
}

const METRIC_ROWS: MetricRow[] = [
	{ label: "Fill-ups", format: (s) => String(s.fillUpCount) },
	{ label: "Total liters", format: (s) => `${formatNumber(s.totalLiters, { maximumFractionDigits: 1 })} L` },
	{ label: "Total spent", format: (s) => formatCurrency(s.totalSpent) },
	{ label: "Avg. fuel price", format: (s) => (s.avgFuelPrice !== null ? formatCurrency(s.avgFuelPrice) : "—") },
	{
		label: "Latest price/L",
		format: (s) => (s.latestPricePerLiter !== null ? formatCurrency(s.latestPricePerLiter) : "—"),
	},
	{
		label: "Avg. consumption",
		format: (s) => (s.avgKmPerL !== null ? `${formatNumber(s.avgKmPerL, { maximumFractionDigits: 2 })} km/L` : "—"),
	},
	{
		label: "Best consumption",
		format: (s) => (s.bestConsumption !== null ? `${formatNumber(s.bestConsumption, { maximumFractionDigits: 2 })} km/L` : "—"),
	},
	{
		label: "Worst consumption",
		format: (s) =>
			s.worstConsumption !== null ? `${formatNumber(s.worstConsumption, { maximumFractionDigits: 2 })} km/L` : "—",
	},
	{
		label: "Estimated autonomy",
		format: (s) =>
			s.estimatedAutonomyKm !== null ? `${formatNumber(s.estimatedAutonomyKm, { maximumFractionDigits: 0 })} km` : "—",
	},
	{ label: "Avg. cost/km", format: (s) => (s.avgCostPerKm !== null ? formatCurrency(s.avgCostPerKm) : "—") },
];

export function FuelComparisonTable({ perFuel }: { perFuel: Record<FuelType, FuelStatistics> }) {
	return (
		<div>
			<h2 className="mb-3 text-lg font-semibold tracking-tight">Gasoline vs. ethanol</h2>
			<div className="overflow-x-auto rounded-xl border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Metric</TableHead>
							{FUEL_TYPES.map((fuelType) => (
								<TableHead key={fuelType} className="text-right">
									{FUEL_LABELS[fuelType]}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{METRIC_ROWS.map((row) => (
							<TableRow key={row.label}>
								<TableCell>{row.label}</TableCell>
								{FUEL_TYPES.map((fuelType) => (
									<TableCell key={fuelType} className="text-right whitespace-nowrap">
										{row.format(perFuel[fuelType])}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			{FUEL_TYPES.filter((fuelType) => perFuel[fuelType].intervalCount < CONFIDENCE_THRESHOLDS.low).map((fuelType) => (
				<p key={fuelType} className="mt-2 text-xs text-muted-foreground">
					{FUEL_LABELS[fuelType]} is based on only {perFuel[fuelType].intervalCount} recorded full-tank interval
					{perFuel[fuelType].intervalCount === 1 ? "" : "s"} — numbers may be unreliable.
				</p>
			))}
		</div>
	);
}
