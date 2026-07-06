"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { chartTooltipContentStyle, chartTooltipItemStyle, chartTooltipLabelStyle } from "@/components/charts/tooltip-style";
import { formatNumber } from "@/lib/format";
import type { MonthlyAggregate } from "@/services/stats";

export function MonthlyLitersChart({ data }: { data: MonthlyAggregate[] }) {
	return (
		<ChartCard title="Monthly liters consumed">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
					<CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
					<XAxis dataKey="month" tick={{ fontSize: 11 }} minTickGap={16} />
					<YAxis tick={{ fontSize: 11 }} width={40} />
					<Tooltip
						contentStyle={chartTooltipContentStyle}
						labelStyle={chartTooltipLabelStyle}
						itemStyle={chartTooltipItemStyle}
						formatter={(value) => [`${formatNumber(Number(value), { maximumFractionDigits: 1 })} L`, "Liters"]}
					/>
					<Bar dataKey="totalLiters" fill="var(--chart-4)" radius={[4, 4, 0, 0]} animationDuration={400} />
				</BarChart>
			</ResponsiveContainer>
		</ChartCard>
	);
}
