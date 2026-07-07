import { StatCard } from "@/components/stat-card";
import { formatCurrency, formatNumber } from "@/lib/format";
import { MIN_RELIABLE_INTERVALS, type FuelTypeStats } from "@/services/fuel-comparison";

export function FuelStatsGrid({ stats }: { stats: FuelTypeStats }) {
	return (
		<div className="flex flex-col gap-2">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
				<StatCard
					label="Avg. consumption"
					value={stats.avgKmPerL !== null ? `${formatNumber(stats.avgKmPerL, { maximumFractionDigits: 2 })} km/L` : "—"}
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
			{stats.intervalCount < MIN_RELIABLE_INTERVALS && (
				<p className="text-xs text-muted-foreground">
					Based on only {stats.intervalCount} recorded full-tank interval{stats.intervalCount === 1 ? "" : "s"} —
					numbers may be unreliable.
				</p>
			)}
		</div>
	);
}
