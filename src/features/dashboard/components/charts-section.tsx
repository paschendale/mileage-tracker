"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { FillUp } from "@/db/schema";
import type { WithMetrics } from "@/services/consumption";
import { groupByMonth } from "@/services/stats";

const ChartSkeleton = () => <Skeleton className="h-[21.5rem] w-full rounded-xl" />;

const MonthlySpendingChart = dynamic(
	() => import("./charts/monthly-spending-chart").then((m) => m.MonthlySpendingChart),
	{ ssr: false, loading: ChartSkeleton },
);
const MonthlyLitersChart = dynamic(
	() => import("./charts/monthly-liters-chart").then((m) => m.MonthlyLitersChart),
	{ ssr: false, loading: ChartSkeleton },
);

/**
 * Combined spending/liters totals across both fuels — unaffected by the
 * dashboard's per-fuel switcher, since total spending isn't fuel-scoped.
 */
export function ChartsSection({ fillUps }: { fillUps: WithMetrics<FillUp>[] }) {
	if (fillUps.length === 0) return null;

	const sorted = [...fillUps].sort((a, b) => a.date.localeCompare(b.date));
	const monthly = groupByMonth(sorted);

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<MonthlySpendingChart data={monthly} />
			<MonthlyLitersChart data={monthly} />
		</div>
	);
}
