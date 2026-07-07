import { Fuel, TriangleAlertIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency, formatDateDisplay, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FieldOutlier } from "@/services/outliers";
import type { FillUpRow, SortableField, SortDirection } from "../queries/get-fillups";
import { FillUpRowActions } from "./fillup-row-actions";
import { SortableColumnHeader } from "./sortable-column-header";

function outlierTooltip(outlier: FieldOutlier, fuelType: string): string {
	const direction = outlier.percentDeviation >= 0 ? "above" : "below";
	const percent = formatNumber(Math.abs(outlier.percentDeviation), { maximumFractionDigits: 0 });
	const label = outlier.field === "pricePerLiter" ? "Price/L" : "Consumption";
	const value =
		outlier.field === "pricePerLiter"
			? formatCurrency(outlier.value)
			: `${formatNumber(outlier.value, { maximumFractionDigits: 2 })} km/L`;
	const avg =
		outlier.field === "pricePerLiter"
			? formatCurrency(outlier.mean)
			: `${formatNumber(outlier.mean, { maximumFractionDigits: 2 })} km/L`;
	return `${label} is ${percent}% ${direction} your typical ${fuelType} value (${value} vs your average ${avg})`;
}

function OutlierWarning({ outlier, fuelType }: { outlier: FieldOutlier; fuelType: string }) {
	return (
		<Tooltip>
			<TooltipTrigger className="inline-flex align-middle">
				<TriangleAlertIcon className="size-3.5 text-amber-500" />
			</TooltipTrigger>
			<TooltipContent>{outlierTooltip(outlier, fuelType)}</TooltipContent>
		</Tooltip>
	);
}

interface FillUpsTableProps {
	rows: FillUpRow[];
	sort: SortableField;
	dir: SortDirection;
	searchParams: Record<string, string | undefined>;
}

export function FillUpsTable({ rows, sort, dir, searchParams }: FillUpsTableProps) {
	if (rows.length === 0) {
		return (
			<EmptyState
				icon={Fuel}
				title="No fill-ups found"
				description="Try a different search, or add your first fill-up."
			/>
		);
	}

	const headerProps = { currentSort: sort, currentDir: dir, searchParams };

	return (
		<div className="overflow-x-auto rounded-xl border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<SortableColumnHeader label="Date" field="date" {...headerProps} />
						</TableHead>
						<TableHead>
							<SortableColumnHeader label="Odometer" field="odometerKm" {...headerProps} />
						</TableHead>
						<TableHead>Fuel type</TableHead>
						<TableHead>
							<SortableColumnHeader label="Liters" field="liters" {...headerProps} />
						</TableHead>
						<TableHead>
							<SortableColumnHeader label="Total price" field="totalPrice" {...headerProps} />
						</TableHead>
						<TableHead>
							<SortableColumnHeader label="Price/L" field="pricePerLiter" {...headerProps} />
						</TableHead>
						<TableHead>Full tank</TableHead>
						<TableHead>
							<SortableColumnHeader label="Consumption" field="consumptionKmPerL" {...headerProps} />
						</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((row) => {
						const hasOutlier = Object.keys(row.outliers).length > 0;
						return (
							<TableRow
								key={row.id}
								className={cn(
									hasOutlier &&
										"bg-amber-500/10 hover:bg-amber-500/15 dark:bg-amber-500/15 dark:hover:bg-amber-500/20",
								)}
							>
								<TableCell className="whitespace-nowrap tabular-nums">{formatDateDisplay(row.date)}</TableCell>
								<TableCell className="whitespace-nowrap tabular-nums">{formatNumber(row.odometerKm)} km</TableCell>
								<TableCell className="capitalize">{row.fuelType}</TableCell>
								<TableCell className="tabular-nums">{formatNumber(row.liters, { maximumFractionDigits: 2 })} L</TableCell>
								<TableCell className="whitespace-nowrap tabular-nums">{formatCurrency(row.totalPrice)}</TableCell>
								<TableCell className="whitespace-nowrap tabular-nums">
									<span className="inline-flex items-center gap-1.5">
										{formatCurrency(row.pricePerLiter)}
										{row.outliers.pricePerLiter && (
											<OutlierWarning outlier={row.outliers.pricePerLiter} fuelType={row.fuelType} />
										)}
									</span>
								</TableCell>
								<TableCell>
									{row.isFullTank ? (
										<Badge variant="secondary">Full</Badge>
									) : (
										<Badge variant="outline">Partial</Badge>
									)}
								</TableCell>
								<TableCell className="whitespace-nowrap tabular-nums">
									<span className="inline-flex items-center gap-1.5">
										{row.consumptionKmPerL !== null
											? `${formatNumber(row.consumptionKmPerL, { maximumFractionDigits: 2 })} km/L`
											: "—"}
										{row.outliers.consumptionKmPerL && (
											<OutlierWarning outlier={row.outliers.consumptionKmPerL} fuelType={row.fuelType} />
										)}
									</span>
								</TableCell>
								<TableCell>
									<FillUpRowActions fillUpId={row.id} />
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
