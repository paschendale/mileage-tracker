import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CONFIDENCE_THRESHOLDS, type FuelEfficiencyTrend, type FuelTypeStats } from "@/services/fuel-comparison";

function EfficiencyTrendHint({ trend }: { trend: FuelEfficiencyTrend }) {
	if (!trend.hasEnoughHistory || trend.direction === null || trend.deltaPercent === null) return undefined;

	const { direction, deltaPercent, sampleSize } = trend;
	const sign = deltaPercent > 0 ? "+" : "";
	const label =
		direction === "flat" ? "Steady" : `${sign}${formatNumber(deltaPercent, { maximumFractionDigits: 0 })}%`;

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1",
				direction === "up" && "text-emerald-600 dark:text-emerald-400",
				direction === "down" && "text-amber-600 dark:text-amber-400",
			)}
		>
			{direction === "up" && <TrendingUp className="size-3" />}
			{direction === "down" && <TrendingDown className="size-3" />}
			{direction === "flat" && <Minus className="size-3" />}
			{label} vs. lifetime (last {sampleSize})
		</span>
	);
}

export function FuelStatsGrid({ stats, trend }: { stats: FuelTypeStats; trend: FuelEfficiencyTrend }) {
	return (
		<div className="flex flex-col gap-2">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
				<StatCard
					label="Avg. efficiency"
					value={stats.avgKmPerL !== null ? `${formatNumber(stats.avgKmPerL, { maximumFractionDigits: 2 })} km/L` : "—"}
					hint={<EfficiencyTrendHint trend={trend} />}
				/>
				<StatCard
					label="Avg. fuel price"
					value={stats.avgFuelPrice !== null ? formatCurrency(stats.avgFuelPrice) : "—"}
				/>
				<StatCard label="Avg. cost/km" value={stats.avgCostPerKm !== null ? formatCurrency(stats.avgCostPerKm) : "—"} />
				<StatCard label="Total spent" value={formatCurrency(stats.totalSpent)} />
				<StatCard label="Total liters" value={`${formatNumber(stats.totalLiters, { maximumFractionDigits: 1 })} L`} />
				<StatCard label="Distance traveled" value={`${formatNumber(stats.distanceTraveledKm)} km`} />
				<StatCard label="Fill-ups" value={String(stats.fillUpCount)} />
				<StatCard
					label="Estimated autonomy"
					value={
						stats.estimatedAutonomyKm !== null
							? `${formatNumber(stats.estimatedAutonomyKm, { maximumFractionDigits: 0 })} km`
							: "—"
					}
				/>
			</div>
			{stats.intervalCount < CONFIDENCE_THRESHOLDS.low && (
				<p className="text-xs text-muted-foreground">
					Based on only {stats.intervalCount} recorded full-tank interval{stats.intervalCount === 1 ? "" : "s"} —
					numbers may be unreliable.
				</p>
			)}
		</div>
	);
}
