"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { MonthlyFuelPricePoint } from "@/services/fuel-comparison";

const ChartSkeleton = () => <Skeleton className="h-[21.5rem] w-full rounded-xl" />;

const PriceTrendChart = dynamic(() => import("./price-trend-chart").then((m) => m.PriceTrendChart), {
	ssr: false,
	loading: ChartSkeleton,
});

export function StatisticsChartsSection({ priceTrend }: { priceTrend: MonthlyFuelPricePoint[] }) {
	if (priceTrend.length === 0) return null;

	return <PriceTrendChart data={priceTrend} />;
}
