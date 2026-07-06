"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { chartTooltipContentStyle, chartTooltipItemStyle, chartTooltipLabelStyle } from "@/components/charts/tooltip-style";
import { formatCurrency } from "@/lib/format";
import type { MonthlyAggregate } from "@/services/stats";

export function MonthlySpendingChart({ data }: { data: MonthlyAggregate[] }) {
	return (
		<ChartCard title="Monthly spending">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
					<CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
					<XAxis dataKey="month" tick={{ fontSize: 11 }} minTickGap={16} />
					<YAxis tick={{ fontSize: 11 }} width={48} />
					<Tooltip
						contentStyle={chartTooltipContentStyle}
						labelStyle={chartTooltipLabelStyle}
						itemStyle={chartTooltipItemStyle}
						formatter={(value) => [formatCurrency(Number(value)), "Spent"]}
					/>
					<Bar dataKey="totalSpent" fill="var(--chart-1)" radius={[4, 4, 0, 0]} animationDuration={400} />
				</BarChart>
			</ResponsiveContainer>
		</ChartCard>
	);
}
