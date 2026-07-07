import { Fuel } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FillUp } from "@/db/schema";
import { formatCurrency, formatDateDisplay, formatNumber } from "@/lib/format";
import type { WithMetrics } from "@/services/consumption";

const RECENT_COUNT = 5;

export function RecentFillUpsTable({ fillUps }: { fillUps: WithMetrics<FillUp>[] }) {
	const recent = [...fillUps].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, RECENT_COUNT);

	if (recent.length === 0) {
		return (
			<EmptyState
				icon={Fuel}
				title="No fill-ups yet"
				description="Add your first fill-up to see it here."
				compact
			/>
		);
	}

	return (
		<div className="overflow-x-auto rounded-xl border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Date</TableHead>
						<TableHead>Odometer</TableHead>
						<TableHead>Fuel type</TableHead>
						<TableHead>Liters</TableHead>
						<TableHead>Total price</TableHead>
						<TableHead>Full tank</TableHead>
						<TableHead>Consumption</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{recent.map((row) => (
						<TableRow key={row.id}>
							<TableCell className="whitespace-nowrap tabular-nums">{formatDateDisplay(row.date)}</TableCell>
							<TableCell className="whitespace-nowrap tabular-nums">{formatNumber(row.odometerKm)} km</TableCell>
							<TableCell className="capitalize">{row.fuelType}</TableCell>
							<TableCell className="tabular-nums">{formatNumber(row.liters, { maximumFractionDigits: 2 })} L</TableCell>
							<TableCell className="whitespace-nowrap tabular-nums">{formatCurrency(row.totalPrice)}</TableCell>
							<TableCell>
								{row.isFullTank ? (
									<Badge variant="secondary">Full</Badge>
								) : (
									<Badge variant="outline">Partial</Badge>
								)}
							</TableCell>
							<TableCell className="whitespace-nowrap tabular-nums">
								{row.consumptionKmPerL !== null
									? `${formatNumber(row.consumptionKmPerL, { maximumFractionDigits: 2 })} km/L`
									: "—"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
