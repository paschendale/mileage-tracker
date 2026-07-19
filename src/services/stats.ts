import { groupBy } from "@/utils/group-by";

export interface StatsFillUp {
	odometerKm: number;
	liters: number;
	totalPrice: number;
	date: string; // ISO 'YYYY-MM-DD'
	isFullTank: boolean;
	efficiencyKmPerL: number | null;
}

function sortedByOdometer(rows: readonly StatsFillUp[]): StatsFillUp[] {
	return [...rows].sort((a, b) => a.odometerKm - b.odometerKm);
}

function fullTankIndexes(rows: readonly StatsFillUp[]): number[] {
	const indexes: number[] = [];
	rows.forEach((row, i) => {
		if (row.isFullTank) indexes.push(i);
	});
	return indexes;
}

export function computeTotalSpent(rows: readonly StatsFillUp[]): number {
	return rows.reduce((sum, r) => sum + r.totalPrice, 0);
}

export function computeTotalLiters(rows: readonly StatsFillUp[]): number {
	return rows.reduce((sum, r) => sum + r.liters, 0);
}

export function computeFillUpCount(rows: readonly StatsFillUp[]): number {
	return rows.length;
}

export function computeDistanceTraveled(rows: readonly StatsFillUp[]): number {
	if (rows.length < 2) return 0;
	const odometers = rows.map((r) => r.odometerKm);
	return Math.max(...odometers) - Math.min(...odometers);
}

export function computeAvgFuelPrice(rows: readonly StatsFillUp[]): number | null {
	const totalLiters = computeTotalLiters(rows);
	return totalLiters > 0 ? computeTotalSpent(rows) / totalLiters : null;
}

export function computeAvgCostPerKm(rows: readonly StatsFillUp[]): number | null {
	const distance = computeDistanceTraveled(rows);
	return distance > 0 ? computeTotalSpent(rows) / distance : null;
}

/**
 * Weighted by the bounded full-tank region: (last full odometer - first full
 * odometer) / (liters consumed across that region), rather than an unweighted
 * mean of per-interval efficiency values, so longer intervals count more.
 */
export function computeAvgKmPerL(rows: readonly StatsFillUp[]): number | null {
	const sorted = sortedByOdometer(rows);
	const indexes = fullTankIndexes(sorted);
	if (indexes.length < 2) return null;

	const firstFull = indexes[0]!;
	const lastFull = indexes[indexes.length - 1]!;
	const distanceKm = sorted[lastFull]!.odometerKm - sorted[firstFull]!.odometerKm;

	let litersSum = 0;
	for (let i = firstFull + 1; i <= lastFull; i++) {
		litersSum += sorted[i]!.liters;
	}

	return litersSum > 0 ? distanceKm / litersSum : null;
}

function nonNullEfficiencyValues(rows: readonly StatsFillUp[]): number[] {
	return rows.map((r) => r.efficiencyKmPerL).filter((v): v is number => v !== null);
}

export function computeBestEfficiency(rows: readonly StatsFillUp[]): number | null {
	const values = nonNullEfficiencyValues(rows);
	return values.length > 0 ? Math.max(...values) : null;
}

export function computeWorstEfficiency(rows: readonly StatsFillUp[]): number | null {
	const values = nonNullEfficiencyValues(rows);
	return values.length > 0 ? Math.min(...values) : null;
}

export function computeDaysSinceLastFillUp(rows: readonly StatsFillUp[], today: Date = new Date()): number | null {
	if (rows.length === 0) return null;
	const lastDate = rows.reduce((latest, r) => (r.date > latest ? r.date : latest), rows[0]!.date);
	const diffMs = today.getTime() - new Date(`${lastDate}T00:00:00`).getTime();
	return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Mean of the per-interval distance covered between consecutive full tanks —
 * i.e. "historically, how far did a full tank actually last". No tank-capacity
 * field exists in the schema, so this is the only data-grounded estimate.
 */
export function computeEstimatedAutonomyKm(rows: readonly StatsFillUp[]): number | null {
	const sorted = sortedByOdometer(rows);
	const indexes = fullTankIndexes(sorted);
	if (indexes.length < 2) return null;

	const distances: number[] = [];
	for (let k = 1; k < indexes.length; k++) {
		const previous = sorted[indexes[k - 1]!]!;
		const current = sorted[indexes[k]!]!;
		distances.push(current.odometerKm - previous.odometerKm);
	}

	return distances.reduce((sum, d) => sum + d, 0) / distances.length;
}

export interface MonthlyAggregate {
	month: string; // 'YYYY-MM'
	totalSpent: number;
	totalLiters: number;
}

export function groupByMonth(rows: readonly StatsFillUp[]): MonthlyAggregate[] {
	const groups = groupBy(rows, (r) => r.date.slice(0, 7));
	return [...groups.entries()]
		.map(([month, groupRows]) => ({
			month,
			totalSpent: computeTotalSpent(groupRows),
			totalLiters: computeTotalLiters(groupRows),
		}))
		.sort((a, b) => a.month.localeCompare(b.month));
}

export interface YearlyAggregate {
	year: string; // 'YYYY'
	totalSpent: number;
}

export function groupByYear(rows: readonly StatsFillUp[]): YearlyAggregate[] {
	const groups = groupBy(rows, (r) => r.date.slice(0, 4));
	return [...groups.entries()]
		.map(([year, groupRows]) => ({ year, totalSpent: computeTotalSpent(groupRows) }))
		.sort((a, b) => a.year.localeCompare(b.year));
}

function monthsSpanned(rows: readonly StatsFillUp[]): number {
	if (rows.length === 0) return 0;
	const dates = rows.map((r) => r.date).sort();
	const first = dates[0]!;
	const last = dates[dates.length - 1]!;
	const firstYear = Number(first.slice(0, 4));
	const firstMonth = Number(first.slice(5, 7));
	const lastYear = Number(last.slice(0, 4));
	const lastMonth = Number(last.slice(5, 7));
	return (lastYear - firstYear) * 12 + (lastMonth - firstMonth) + 1;
}

export function computeAvgMonthlyDistance(rows: readonly StatsFillUp[]): number | null {
	const span = monthsSpanned(rows);
	return span > 0 ? computeDistanceTraveled(rows) / span : null;
}

export function computeAvgMonthlySpending(rows: readonly StatsFillUp[]): number | null {
	const span = monthsSpanned(rows);
	return span > 0 ? computeTotalSpent(rows) / span : null;
}
