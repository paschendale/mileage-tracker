"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { FillUp } from "@/db/schema";
import type { WithMetrics } from "@/services/efficiency";
import { computeFuelEfficiencyPoints, computeMonthlyFuelPriceTrend } from "@/services/fuel-comparison";
import { formatNumber } from "@/lib/format";
import { computeTripEfficiencyPoints } from "@/services/trip-comparison";

const ChartSkeleton = () => <Skeleton className="h-[21.5rem] w-full rounded-xl" />;

const MultiSeriesLineChart = dynamic(
	() => import("@/components/charts/multi-series-line-chart").then((m) => m.MultiSeriesLineChart),
	{ ssr: false, loading: ChartSkeleton },
);
const PriceTrendChart = dynamic(() => import("@/components/charts/price-trend-chart").then((m) => m.PriceTrendChart), {
	ssr: false,
	loading: ChartSkeleton,
});

/**
 * Always-on fuel × trip comparisons — replaces the old single-fuel-toggle
 * chart pair with charts that show both sides of each dimension at once.
 */
export function DashboardChartsSection({ fillUps }: { fillUps: WithMetrics<FillUp>[] }) {
	if (fillUps.length === 0) return null;

	const fuelEfficiencyPoints = computeFuelEfficiencyPoints(fillUps);
	const tripEfficiencyPoints = computeTripEfficiencyPoints(fillUps);
	const priceTrend = computeMonthlyFuelPriceTrend(fillUps);

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<MultiSeriesLineChart
				title="Efficiency by fuel type"
				data={fuelEfficiencyPoints}
				series={[
					{ dataKey: "gasoline", label: "Gasoline", color: "var(--chart-3)" },
					{ dataKey: "ethanol", label: "Ethanol", color: "var(--chart-5)" },
				]}
				valueFormatter={(v) => `${formatNumber(v, { maximumFractionDigits: 2 })} km/L`}
			/>
			<MultiSeriesLineChart
				title="Efficiency by trip type"
				data={tripEfficiencyPoints}
				series={[
					{ dataKey: "road", label: "Road", color: "var(--chart-1)" },
					{ dataKey: "city", label: "City", color: "var(--chart-2)" },
				]}
				valueFormatter={(v) => `${formatNumber(v, { maximumFractionDigits: 2 })} km/L`}
			/>
			{priceTrend.length > 0 && <PriceTrendChart data={priceTrend} />}
		</div>
	);
}
