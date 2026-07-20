"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { chartTooltipContentStyle, chartTooltipItemStyle, chartTooltipLabelStyle } from "@/components/charts/tooltip-style";
import { formatDateDisplay } from "@/lib/format";

export interface ChartSeries {
	dataKey: string;
	label: string;
	color: string;
}

export interface MultiSeriesLineChartProps {
	title: string;
	data: readonly { date: string }[];
	series: ChartSeries[];
	valueFormatter: (value: number) => string;
}

/**
 * Two (or more) interleaved per-fill-up series sharing one date axis — e.g.
 * gasoline/ethanol efficiency, where any given point only has a value for
 * whichever fuel that fill-up actually was. `connectNulls` is intentionally
 * always on here: a null for one series at another series' date isn't a real
 * data gap (unlike the monthly price trend chart, where a null month really
 * does mean "no purchase, unknown price") — each line should just connect
 * across the other series' points to its own next real value.
 */
export function MultiSeriesLineChart({ title, data, series, valueFormatter }: MultiSeriesLineChartProps) {
	return (
		<ChartCard title={title}>
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
					<CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
					<XAxis
						dataKey="date"
						tickFormatter={(value: string) => formatDateDisplay(value)}
						tick={{ fontSize: 11 }}
						minTickGap={24}
					/>
					<YAxis tick={{ fontSize: 11 }} width={48} />
					<Tooltip
						contentStyle={chartTooltipContentStyle}
						labelStyle={chartTooltipLabelStyle}
						itemStyle={chartTooltipItemStyle}
						formatter={(value) => [valueFormatter(Number(value)), ""]}
						labelFormatter={(label) => formatDateDisplay(String(label))}
					/>
					<Legend wrapperStyle={{ fontSize: 12 }} />
					{series.map((s) => (
						<Line
							key={s.dataKey}
							type="monotone"
							dataKey={s.dataKey}
							name={s.label}
							stroke={s.color}
							strokeWidth={2}
							dot={false}
							connectNulls
							animationDuration={400}
						/>
					))}
				</LineChart>
			</ResponsiveContainer>
		</ChartCard>
	);
}
