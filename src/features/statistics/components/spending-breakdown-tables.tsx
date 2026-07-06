import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import type { MonthlyAggregate, YearlyAggregate } from "@/services/stats";

export function SpendingBreakdownTables({ monthly, yearly }: { monthly: MonthlyAggregate[]; yearly: YearlyAggregate[] }) {
	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<div>
				<h2 className="mb-3 text-lg font-semibold tracking-tight">Monthly spending</h2>
				<div className="max-h-80 overflow-y-auto rounded-xl border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Month</TableHead>
								<TableHead className="text-right">Spent</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{[...monthly].reverse().map((row) => (
								<TableRow key={row.month}>
									<TableCell>{row.month}</TableCell>
									<TableCell className="text-right">{formatCurrency(row.totalSpent)}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>

			<div>
				<h2 className="mb-3 text-lg font-semibold tracking-tight">Yearly spending</h2>
				<div className="rounded-xl border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Year</TableHead>
								<TableHead className="text-right">Spent</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{[...yearly].reverse().map((row) => (
								<TableRow key={row.year}>
									<TableCell>{row.year}</TableCell>
									<TableCell className="text-right">{formatCurrency(row.totalSpent)}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}
