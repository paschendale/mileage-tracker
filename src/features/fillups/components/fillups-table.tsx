import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateDisplay, formatNumber } from "@/lib/format";
import type { FillUpRow, SortableField, SortDirection } from "../queries/get-fillups";
import { FillUpRowActions } from "./fillup-row-actions";
import { SortableColumnHeader } from "./sortable-column-header";

interface FillUpsTableProps {
	rows: FillUpRow[];
	sort: SortableField;
	dir: SortDirection;
	searchParams: Record<string, string | undefined>;
}

export function FillUpsTable({ rows, sort, dir, searchParams }: FillUpsTableProps) {
	if (rows.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-24 text-center">
				<p className="font-medium">No fill-ups found</p>
				<p className="text-sm text-muted-foreground">Try a different search, or add your first fill-up.</p>
			</div>
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
					{rows.map((row) => (
						<TableRow key={row.id}>
							<TableCell className="whitespace-nowrap">{formatDateDisplay(row.date)}</TableCell>
							<TableCell className="whitespace-nowrap">{formatNumber(row.odometerKm)} km</TableCell>
							<TableCell className="capitalize">{row.fuelType}</TableCell>
							<TableCell>{formatNumber(row.liters, { maximumFractionDigits: 2 })} L</TableCell>
							<TableCell className="whitespace-nowrap">{formatCurrency(row.totalPrice)}</TableCell>
							<TableCell className="whitespace-nowrap">{formatCurrency(row.pricePerLiter)}</TableCell>
							<TableCell>
								{row.isFullTank ? (
									<Badge variant="secondary">Full</Badge>
								) : (
									<Badge variant="outline">Partial</Badge>
								)}
							</TableCell>
							<TableCell className="whitespace-nowrap">
								{row.consumptionKmPerL !== null
									? `${formatNumber(row.consumptionKmPerL, { maximumFractionDigits: 2 })} km/L`
									: "—"}
							</TableCell>
							<TableCell>
								<FillUpRowActions fillUpId={row.id} />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
