import { formatCurrency, formatNumber } from "@/lib/format";
import type { DashboardData } from "../lib/get-dashboard-data";
import { StatCard } from "./stat-card";

export function StatsGrid({ data }: { data: DashboardData }) {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			<StatCard
				label="Avg. consumption"
				value={data.avgKmPerL !== null ? `${formatNumber(data.avgKmPerL, { maximumFractionDigits: 2 })} km/L` : "—"}
			/>
			<StatCard
				label="Avg. fuel price"
				value={data.avgFuelPrice !== null ? formatCurrency(data.avgFuelPrice) : "—"}
			/>
			<StatCard
				label="Avg. cost/km"
				value={data.avgCostPerKm !== null ? formatCurrency(data.avgCostPerKm) : "—"}
			/>
			<StatCard label="Total spent" value={formatCurrency(data.totalSpent)} />
			<StatCard label="Total liters" value={`${formatNumber(data.totalLiters, { maximumFractionDigits: 1 })} L`} />
			<StatCard label="Distance traveled" value={`${formatNumber(data.distanceTraveled)} km`} />
			<StatCard label="Fill-ups" value={String(data.fillUpCount)} />
			<StatCard
				label="Days since last fill-up"
				value={data.daysSinceLastFillUp !== null ? String(data.daysSinceLastFillUp) : "—"}
			/>
			<StatCard
				label="Estimated autonomy"
				value={
					data.estimatedAutonomyKm !== null
						? `${formatNumber(data.estimatedAutonomyKm, { maximumFractionDigits: 0 })} km`
						: "—"
				}
			/>
		</div>
	);
}
