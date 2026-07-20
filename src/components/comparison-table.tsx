import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/format";
import { CONFIDENCE_THRESHOLDS } from "@/services/fuel-comparison";

/**
 * Shape shared by FuelTypeStats and TripTypeStats (and their *Statistics
 * extensions with outlier-excluded best/worst) — every "compare N groups of
 * fill-ups against each other" table in this app renders one of these.
 */
export interface ComparisonStats {
	intervalCount: number;
	fillUpCount: number;
	totalLiters: number;
	totalSpent: number;
	avgFuelPrice: number | null;
	latestPricePerLiter: number | null;
	avgKmPerL: number | null;
	estimatedAutonomyKm: number | null;
	avgCostPerKm: number | null;
	/** Optional so plain FuelTypeStats/TripTypeStats (no outlier-excluded best/worst) still satisfy this bound. */
	bestEfficiency?: number | null;
	worstEfficiency?: number | null;
}

export interface ComparisonColumn<K extends string> {
	key: K;
	label: string;
}

export interface ComparisonMetricRow<S extends ComparisonStats = ComparisonStats> {
	label: string;
	format: (stats: S) => string;
}

function hasValue(value: number | null | undefined): value is number {
	return value !== null && value !== undefined;
}

/** The 10 metrics both existing statistics tables render, in order. */
export const FULL_COMPARISON_METRIC_ROWS: ComparisonMetricRow[] = [
	{ label: "Fill-ups", format: (s) => String(s.fillUpCount) },
	{ label: "Total liters", format: (s) => `${formatNumber(s.totalLiters, { maximumFractionDigits: 1 })} L` },
	{ label: "Total spent", format: (s) => formatCurrency(s.totalSpent) },
	{ label: "Avg. fuel price", format: (s) => (s.avgFuelPrice !== null ? formatCurrency(s.avgFuelPrice) : "—") },
	{
		label: "Latest price/L",
		format: (s) => (s.latestPricePerLiter !== null ? formatCurrency(s.latestPricePerLiter) : "—"),
	},
	{
		label: "Avg. efficiency",
		format: (s) => (s.avgKmPerL !== null ? `${formatNumber(s.avgKmPerL, { maximumFractionDigits: 2 })} km/L` : "—"),
	},
	{
		label: "Best efficiency",
		format: (s) => (hasValue(s.bestEfficiency) ? `${formatNumber(s.bestEfficiency, { maximumFractionDigits: 2 })} km/L` : "—"),
	},
	{
		label: "Worst efficiency",
		format: (s) =>
			hasValue(s.worstEfficiency) ? `${formatNumber(s.worstEfficiency, { maximumFractionDigits: 2 })} km/L` : "—",
	},
	{
		label: "Estimated autonomy",
		format: (s) =>
			s.estimatedAutonomyKm !== null ? `${formatNumber(s.estimatedAutonomyKm, { maximumFractionDigits: 0 })} km` : "—",
	},
	{ label: "Avg. cost/km", format: (s) => (s.avgCostPerKm !== null ? formatCurrency(s.avgCostPerKm) : "—") },
];

/** Same as above, minus Best/Worst efficiency — outlier exclusion isn't computed on the dashboard. */
export const BASIC_COMPARISON_METRIC_ROWS: ComparisonMetricRow[] = FULL_COMPARISON_METRIC_ROWS.filter(
	(row) => row.label !== "Best efficiency" && row.label !== "Worst efficiency",
);

export interface ComparisonTableProps<K extends string, S extends ComparisonStats> {
	title: string;
	columns: ComparisonColumn<K>[];
	data: Record<K, S>;
	metricRows?: ComparisonMetricRow<S>[];
	/** "recorded full-tank interval" vs "leg" — the one wording difference between call sites. */
	lowConfidenceNoun?: string;
}

export function ComparisonTable<K extends string, S extends ComparisonStats>({
	title,
	columns,
	data,
	metricRows = FULL_COMPARISON_METRIC_ROWS,
	lowConfidenceNoun = "interval",
}: ComparisonTableProps<K, S>) {
	return (
		<div>
			<h2 className="mb-3 text-lg font-semibold tracking-tight">{title}</h2>
			<div className="overflow-x-auto rounded-xl border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Metric</TableHead>
							{columns.map((column) => (
								<TableHead key={column.key} className="text-right">
									{column.label}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{metricRows.map((row) => (
							<TableRow key={row.label}>
								<TableCell>{row.label}</TableCell>
								{columns.map((column) => (
									<TableCell key={column.key} className="text-right whitespace-nowrap">
										{row.format(data[column.key])}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			{columns
				.filter((column) => data[column.key].intervalCount < CONFIDENCE_THRESHOLDS.low)
				.map((column) => (
					<p key={column.key} className="mt-2 text-xs text-muted-foreground">
						{column.label} is based on only {data[column.key].intervalCount} recorded full-tank {lowConfidenceNoun}
						{data[column.key].intervalCount === 1 ? "" : "s"} — numbers may be unreliable.
					</p>
				))}
		</div>
	);
}
