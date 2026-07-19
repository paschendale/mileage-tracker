import type { FillUp, FuelType } from "@/db/schema";
import { getVehicleFillUpsWithMetrics } from "@/services/fillups";
import type { WithMetrics } from "@/services/efficiency";
import { detectOutliers, type OutlierFlags } from "@/services/outliers";
import { paginate, type PaginatedResult } from "@/utils/pagination";

export const SORTABLE_FIELDS = ["date", "odometerKm", "liters", "totalPrice", "pricePerLiter", "efficiencyKmPerL"] as const;
export type SortableField = (typeof SORTABLE_FIELDS)[number];
export type SortDirection = "asc" | "desc";

export type FillUpRow = WithMetrics<FillUp> & {
	pricePerLiter: number;
	outliers: OutlierFlags;
	isPersonalBest: boolean;
};

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
		case "efficiencyKmPerL":
			return (a.efficiencyKmPerL ?? -Infinity) - (b.efficiencyKmPerL ?? -Infinity);
	}
}

export async function getFillUpsPage(
	vehicleId: number,
	options: GetFillUpsPageOptions = {},
): Promise<PaginatedResult<FillUpRow>> {
	const rows = await getVehicleFillUpsWithMetrics(vehicleId);
	const withPricePerLiter = rows.map((row) => ({
		...row,
		pricePerLiter: row.liters > 0 ? row.totalPrice / row.liters : 0,
	}));

	// Computed on the full vehicle history, before search/sort/pagination, so
	// flags reflect the whole history rather than shifting with the active page.
	const outlierMap = detectOutliers(withPricePerLiter);

	// The record-holding row per fuel type, excluding outliers (a mistyped
	// odometer reading shouldn't get to "hold the record") — same exclusion
	// rule get-statistics.ts uses for best/worst efficiency.
	const bestByFuelType = new Map<FuelType, number>();
	for (const row of withPricePerLiter) {
		if (row.efficiencyKmPerL === null || outlierMap.get(row.id)?.efficiencyKmPerL) continue;
		const current = bestByFuelType.get(row.fuelType);
		if (current === undefined || row.efficiencyKmPerL > current) bestByFuelType.set(row.fuelType, row.efficiencyKmPerL);
	}

	const withOutliers: FillUpRow[] = withPricePerLiter.map((row) => ({
		...row,
		outliers: outlierMap.get(row.id) ?? {},
		isPersonalBest: row.efficiencyKmPerL !== null && bestByFuelType.get(row.fuelType) === row.efficiencyKmPerL,
	}));

	const query = options.query?.trim().toLowerCase();
	const filtered = query
		? withOutliers.filter(
				(row) =>
					row.date.includes(query) ||
					row.fuelType.toLowerCase().includes(query) ||
					(row.notes ?? "").toLowerCase().includes(query),
			)
		: withOutliers;

	const sort = options.sort ?? "date";
	const dir = options.dir ?? "desc";
	const sorted = [...filtered].sort((a, b) => {
		const cmp = compareRows(a, b, sort);
		if (cmp !== 0) return dir === "asc" ? cmp : -cmp;
		// `date` only has day precision, so same-day rows can otherwise land in
		// arbitrary order. Odometer strictly increases with real events, so it's
		// the true chronological tie-break — applied in the same direction as the
		// primary sort, so a "desc" (most-recent-first) list stays most-recent-first
		// within a tied day too, instead of flipping to oldest-first locally.
		const odometerCmp = a.odometerKm - b.odometerKm || a.id - b.id;
		return dir === "asc" ? odometerCmp : -odometerCmp;
	});

	return paginate(sorted, options.page ?? 1, options.pageSize ?? 50);
}
