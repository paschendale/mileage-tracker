"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { chartTooltipContentStyle, chartTooltipItemStyle, chartTooltipLabelStyle } from "@/components/charts/tooltip-style";
import { formatCurrency } from "@/lib/format";
import type { MonthlyFuelPricePoint } from "@/services/fuel-comparison";

/** A fuel with no purchase that month is left `undefined` for Recharts — no line drawn across the gap, since we don't know what it would have cost. */
export function PriceTrendChart({ data }: { data: MonthlyFuelPricePoint[] }) {
	return (
		<ChartCard title="Fuel price trend (gasoline vs. ethanol)">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
					<CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
					<XAxis dataKey="month" tick={{ fontSize: 11 }} minTickGap={24} />
					<YAxis tick={{ fontSize: 11 }} width={48} />
					<Tooltip
						contentStyle={chartTooltipContentStyle}
						labelStyle={chartTooltipLabelStyle}
						itemStyle={chartTooltipItemStyle}
						formatter={(value) => [formatCurrency(Number(value)), ""]}
					/>
					<Legend wrapperStyle={{ fontSize: 12 }} />
					<Line
						type="monotone"
						dataKey="gasoline"
						name="Gasoline"
						stroke="var(--chart-1)"
						strokeWidth={2}
						dot={false}
						animationDuration={400}
					/>
					<Line
						type="monotone"
						dataKey="ethanol"
						name="Ethanol"
						stroke="var(--chart-3)"
						strokeWidth={2}
						dot={false}
						animationDuration={400}
					/>
				</LineChart>
			</ResponsiveContainer>
		</ChartCard>
	);
}
