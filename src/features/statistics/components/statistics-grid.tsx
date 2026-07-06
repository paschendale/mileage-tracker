import { StatCard } from "@/components/stat-card";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { StatisticsData } from "../queries/get-statistics";

export function StatisticsGrid({ data }: { data: StatisticsData }) {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			<StatCard
				label="Avg. consumption"
				value={data.avgKmPerL !== null ? `${formatNumber(data.avgKmPerL, { maximumFractionDigits: 2 })} km/L` : "—"}
			/>
			<StatCard
				label="Best consumption"
				value={
					data.bestConsumption !== null
						? `${formatNumber(data.bestConsumption, { maximumFractionDigits: 2 })} km/L`
						: "—"
				}
			/>
			<StatCard
				label="Worst consumption"
				value={
					data.worstConsumption !== null
						? `${formatNumber(data.worstConsumption, { maximumFractionDigits: 2 })} km/L`
						: "—"
				}
			/>
			<StatCard
				label="Avg. fuel price"
				value={data.avgFuelPrice !== null ? formatCurrency(data.avgFuelPrice) : "—"}
			/>
			<StatCard
				label="Avg. cost/km"
				value={data.avgCostPerKm !== null ? formatCurrency(data.avgCostPerKm) : "—"}
			/>
			<StatCard label="Distance traveled" value={`${formatNumber(data.distanceTraveled)} km`} />
			<StatCard label="Fuel consumed" value={`${formatNumber(data.totalLiters, { maximumFractionDigits: 1 })} L`} />
			<StatCard
				label="Avg. monthly distance"
				value={
					data.avgMonthlyDistance !== null
						? `${formatNumber(data.avgMonthlyDistance, { maximumFractionDigits: 0 })} km`
						: "—"
				}
			/>
			<StatCard
				label="Avg. monthly spending"
				value={data.avgMonthlySpending !== null ? formatCurrency(data.avgMonthlySpending) : "—"}
			/>
		</div>
	);
}
