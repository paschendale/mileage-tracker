"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { FillUp } from "@/db/schema";
import type { WithMetrics } from "@/services/consumption";
import { groupByMonth } from "@/services/stats";

const ChartSkeleton = () => <Skeleton className="h-[21.5rem] w-full rounded-xl" />;

const ConsumptionChart = dynamic(() => import("./charts/consumption-chart").then((m) => m.ConsumptionChart), {
	ssr: false,
	loading: ChartSkeleton,
});
const FuelPriceChart = dynamic(() => import("./charts/fuel-price-chart").then((m) => m.FuelPriceChart), {
	ssr: false,
	loading: ChartSkeleton,
});
const MonthlySpendingChart = dynamic(
	() => import("./charts/monthly-spending-chart").then((m) => m.MonthlySpendingChart),
	{ ssr: false, loading: ChartSkeleton },
);
const MonthlyLitersChart = dynamic(
	() => import("./charts/monthly-liters-chart").then((m) => m.MonthlyLitersChart),
	{ ssr: false, loading: ChartSkeleton },
);

function hasConsumption(fillUp: WithMetrics<FillUp>): fillUp is WithMetrics<FillUp> & { consumptionKmPerL: number } {
	return fillUp.consumptionKmPerL !== null;
}

export function ChartsSection({ fillUps }: { fillUps: WithMetrics<FillUp>[] }) {
	if (fillUps.length === 0) return null;

	const sorted = [...fillUps].sort((a, b) => a.date.localeCompare(b.date));

	const consumptionPoints = sorted
		.filter(hasConsumption)
		.map((f) => ({ date: f.date, consumptionKmPerL: f.consumptionKmPerL }));

	const fuelPricePoints = sorted
		.filter((f) => f.liters > 0)
		.map((f) => ({ date: f.date, pricePerLiter: f.totalPrice / f.liters }));

	const monthly = groupByMonth(sorted);

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<ConsumptionChart points={consumptionPoints} />
			<FuelPriceChart points={fuelPricePoints} />
			<MonthlySpendingChart data={monthly} />
			<MonthlyLitersChart data={monthly} />
		</div>
	);
}
