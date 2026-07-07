export interface ConsumptionMetrics {
	distanceSincePreviousKm: number | null;
	/** Only ever non-null on the fill-up that closes a full-tank interval. */
	consumptionKmPerL: number | null;
}

export type WithMetrics<T> = T & ConsumptionMetrics;

export interface MinimalFillUp {
	id: number;
	odometerKm: number;
	liters: number;
	date: string;
	isFullTank: boolean;
}

export function sortByOdometer<T extends MinimalFillUp>(rowsUnordered: readonly T[]): T[] {
	return [...rowsUnordered].sort(
		(a, b) => a.odometerKm - b.odometerKm || a.date.localeCompare(b.date) || a.id - b.id,
	);
}

export interface FullTankInterval<T> {
	/** The opening full-tank row — determines which fuel actually powered this interval. */
	open: T;
	/** The closing full-tank row — where consumptionKmPerL is conventionally displayed. */
	close: T;
	distanceKm: number;
	/** Liters of everything strictly after `open` through `close` inclusive. */
	litersSum: number;
	consumptionKmPerL: number | null;
}

/**
 * Walks the full-tank-to-full-tank intervals of an odometer-sorted fill-up sequence.
 *
 * Consumption between two full tanks sums the liters of every fill-up strictly
 * after the opening full tank through the closing full tank inclusive (partials
 * in between plus the closing fill itself) — the opening full tank's own liters
 * belong to the interval that precedes it, matching the spec's worked example.
 *
 * `sortedRows` must already be sorted by odometer (see `sortByOdometer`).
 */
export function findFullTankIntervals<T extends MinimalFillUp>(sortedRows: readonly T[]): FullTankInterval<T>[] {
	const fullTankIndexes: number[] = [];
	sortedRows.forEach((row, i) => {
		if (row.isFullTank) fullTankIndexes.push(i);
	});

	const intervals: FullTankInterval<T>[] = [];
	for (let k = 1; k < fullTankIndexes.length; k++) {
		const previousFullIndex = fullTankIndexes[k - 1]!;
		const currentFullIndex = fullTankIndexes[k]!;
		const open = sortedRows[previousFullIndex]!;
		const close = sortedRows[currentFullIndex]!;
		const distanceKm = close.odometerKm - open.odometerKm;

		let litersSum = 0;
		for (let i = previousFullIndex + 1; i <= currentFullIndex; i++) {
			litersSum += sortedRows[i]!.liters;
		}

		intervals.push({
			open,
			close,
			distanceKm,
			litersSum,
			consumptionKmPerL: litersSum > 0 ? distanceKm / litersSum : null,
		});
	}

	return intervals;
}

/**
 * Derives distance-since-previous and fuel consumption for a vehicle's fill-ups.
 *
 * Distance since previous is defined for every consecutive pair (full or partial).
 * Consumption is only ever defined between two full-tank fill-ups: any partial
 * fill-ups in between contribute their liters to the interval but never produce
 * their own consumption value. Nothing here is persisted — call this on every
 * read so mutations never require cascading recalculation.
 */
export function withComputedMetrics<T extends MinimalFillUp>(rowsUnordered: readonly T[]): WithMetrics<T>[] {
	const rows = sortByOdometer(rowsUnordered);

	const result: WithMetrics<T>[] = rows.map((row) => ({
		...row,
		distanceSincePreviousKm: null,
		consumptionKmPerL: null,
	}));

	for (let i = 1; i < rows.length; i++) {
		const previous = rows[i - 1]!;
		const current = rows[i]!;
		result[i]!.distanceSincePreviousKm = current.odometerKm - previous.odometerKm;
	}

	const indexById = new Map(rows.map((row, i) => [row.id, i]));
	for (const interval of findFullTankIntervals(rows)) {
		const closeIndex = indexById.get(interval.close.id)!;
		result[closeIndex]!.consumptionKmPerL = interval.consumptionKmPerL;
	}

	return result;
}
