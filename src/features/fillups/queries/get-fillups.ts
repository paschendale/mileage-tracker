import type { FillUp } from "@/db/schema";
import { getVehicleFillUpsWithMetrics } from "@/services/fillups";
import type { WithMetrics } from "@/services/consumption";
import { paginate, type PaginatedResult } from "@/utils/pagination";

export const SORTABLE_FIELDS = ["date", "odometerKm", "liters", "totalPrice", "pricePerLiter", "consumptionKmPerL"] as const;
export type SortableField = (typeof SORTABLE_FIELDS)[number];
export type SortDirection = "asc" | "desc";

export type FillUpRow = WithMetrics<FillUp> & { pricePerLiter: number };

export interface GetFillUpsPageOptions {
	query?: string;
	sort?: SortableField;
	dir?: SortDirection;
	page?: number;
	pageSize?: number;
}

function compareRows(a: FillUpRow, b: FillUpRow, sort: SortableField): number {
	switch (sort) {
		case "date":
			return a.date.localeCompare(b.date);
		case "odometerKm":
			return a.odometerKm - b.odometerKm;
		case "liters":
			return a.liters - b.liters;
		case "totalPrice":
			return a.totalPrice - b.totalPrice;
		case "pricePerLiter":
			return a.pricePerLiter - b.pricePerLiter;
		case "consumptionKmPerL":
			return (a.consumptionKmPerL ?? -Infinity) - (b.consumptionKmPerL ?? -Infinity);
	}
}

export async function getFillUpsPage(
	vehicleId: number,
	options: GetFillUpsPageOptions = {},
): Promise<PaginatedResult<FillUpRow>> {
	const rows = await getVehicleFillUpsWithMetrics(vehicleId);
	const withPricePerLiter: FillUpRow[] = rows.map((row) => ({
		...row,
		pricePerLiter: row.liters > 0 ? row.totalPrice / row.liters : 0,
	}));

	const query = options.query?.trim().toLowerCase();
	const filtered = query
		? withPricePerLiter.filter(
				(row) =>
					row.date.includes(query) ||
					row.fuelType.toLowerCase().includes(query) ||
					(row.notes ?? "").toLowerCase().includes(query),
			)
		: withPricePerLiter;

	const sort = options.sort ?? "date";
	const dir = options.dir ?? "desc";
	const sorted = [...filtered].sort((a, b) => {
		const cmp = compareRows(a, b, sort);
		return dir === "asc" ? cmp : -cmp;
	});

	return paginate(sorted, options.page ?? 1, options.pageSize ?? 15);
}
