import { StatCard } from "@/components/stat-card";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { StatisticsData } from "../queries/get-statistics";

/** Vehicle-level totals only — fuel-specific numbers live in the fuel comparison table below. */
export function StatisticsGrid({ data }: { data: StatisticsData }) {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			<StatCard label="Fill-ups" value={String(data.fillUpCount)} />
			<StatCard label="Distance traveled" value={`${formatNumber(data.distanceTraveled)} km`} />
			<StatCard label="Total spent" value={formatCurrency(data.totalSpent)} />
			<StatCard label="Fuel used" value={`${formatNumber(data.totalLiters, { maximumFractionDigits: 1 })} L`} />
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
