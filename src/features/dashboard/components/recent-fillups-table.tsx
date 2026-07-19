import { Fuel, Trophy } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency, formatDateDisplay, formatNumber } from "@/lib/format";
import type { DashboardFillUp } from "../lib/get-dashboard-data";

const RECENT_COUNT = 5;

export function RecentFillUpsTable({ fillUps }: { fillUps: DashboardFillUp[] }) {
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
						<TableHead>Efficiency</TableHead>
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
								<span className="inline-flex items-center gap-1.5">
									{row.efficiencyKmPerL !== null
										? `${formatNumber(row.efficiencyKmPerL, { maximumFractionDigits: 2 })} km/L`
										: "—"}
									{row.isPersonalBest && (
										<Tooltip>
											<TooltipTrigger className="inline-flex align-middle">
												<Trophy className="size-3.5 text-amber-500" />
											</TooltipTrigger>
											<TooltipContent>Best {row.fuelType} efficiency recorded</TooltipContent>
										</Tooltip>
									)}
								</span>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
