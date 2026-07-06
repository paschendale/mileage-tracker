"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { formatDateDisplay, formatNumber } from "@/lib/format";

interface ConsumptionPoint {
	date: string;
	consumptionKmPerL: number;
}

export function ConsumptionChart({ points }: { points: ConsumptionPoint[] }) {
	return (
		<ChartCard title="Consumption over time">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={points} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
					<CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
					<XAxis
						dataKey="date"
						tickFormatter={(value: string) => formatDateDisplay(value)}
						tick={{ fontSize: 11 }}
						minTickGap={24}
					/>
					<YAxis tick={{ fontSize: 11 }} width={40} />
					<Tooltip
						formatter={(value) => [`${formatNumber(Number(value), { maximumFractionDigits: 2 })} km/L`, "Consumption"]}
						labelFormatter={(label) => formatDateDisplay(String(label))}
					/>
					<Line
						type="monotone"
						dataKey="consumptionKmPerL"
						stroke="var(--chart-2)"
						strokeWidth={2}
						dot={false}
						animationDuration={400}
					/>
				</LineChart>
			</ResponsiveContainer>
		</ChartCard>
	);
}
