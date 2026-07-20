export interface EfficiencyMetrics {
	distanceSincePreviousKm: number | null;
	/**
	 * Non-null only when this row and the immediately preceding row (by
	 * odometer) are both full tanks. There is no multi-row interval concept:
	 * a full tank immediately preceded by a partial gets `null` here (that
	 * leg is discarded, not estimated), and the very first row in a vehicle's
	 * history is always `null` (no previous row to pair with).
	 */
	efficiencyKmPerL: number | null;
}

export type WithMetrics<T> = T & EfficiencyMetrics;

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

/**
 * Derives distance-since-previous and fuel efficiency for a vehicle's fill-ups.
 *
 * Distance since previous is defined for every consecutive pair (full or
 * partial). Efficiency is only defined between two *immediately adjacent*
 * full-tank fill-ups — `(row[i].odometerKm - row[i-1].odometerKm) / row[i].liters`,
 * the later row's own liters. If either row in the pair is a partial, the leg
 * is discarded (`null`), not estimated. Nothing here is persisted — call this
 * on every read so mutations never require cascading recalculation.
 */
export function withComputedMetrics<T extends MinimalFillUp>(rowsUnordered: readonly T[]): WithMetrics<T>[] {
	const rows = sortByOdometer(rowsUnordered);

	return rows.map((row, i) => {
		if (i === 0) {
			return { ...row, distanceSincePreviousKm: null, efficiencyKmPerL: null };
		}
		const previous = rows[i - 1]!;
		const distanceSincePreviousKm = row.odometerKm - previous.odometerKm;
		const efficiencyKmPerL =
			row.isFullTank && previous.isFullTank ? distanceSincePreviousKm / row.liters : null;
		return { ...row, distanceSincePreviousKm, efficiencyKmPerL };
	});
}
