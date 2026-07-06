export interface ConsumptionMetrics {
	distanceSincePreviousKm: number | null;
	/** Only ever non-null on the fill-up that closes a full-tank interval. */
	consumptionKmPerL: number | null;
}

export type WithMetrics<T> = T & ConsumptionMetrics;

interface MinimalFillUp {
	id: number;
	odometerKm: number;
	liters: number;
	date: string;
	isFullTank: boolean;
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
	const rows = [...rowsUnordered].sort(
		(a, b) => a.odometerKm - b.odometerKm || a.date.localeCompare(b.date) || a.id - b.id,
	);

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

	const fullTankIndexes: number[] = [];
	rows.forEach((row, i) => {
		if (row.isFullTank) fullTankIndexes.push(i);
	});

	for (let k = 1; k < fullTankIndexes.length; k++) {
		const previousFullIndex = fullTankIndexes[k - 1]!;
		const currentFullIndex = fullTankIndexes[k]!;
		const distanceKm = rows[currentFullIndex]!.odometerKm - rows[previousFullIndex]!.odometerKm;

		// Liters of every fill-up strictly after the opening full tank through the
		// closing full tank inclusive: the partials in between plus the closing
		// fill itself. The opening full tank's own liters belong to the interval
		// that precedes it, matching the spec's worked example exactly.
		let litersSum = 0;
		for (let i = previousFullIndex + 1; i <= currentFullIndex; i++) {
			litersSum += rows[i]!.liters;
		}

		result[currentFullIndex]!.consumptionKmPerL = litersSum > 0 ? distanceKm / litersSum : null;
	}

	return result;
}
