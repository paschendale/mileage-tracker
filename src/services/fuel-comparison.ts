import { FUEL_TYPES, type FuelType } from "@/db/schema";
import { groupBy } from "@/utils/group-by";
import { sortByOdometer, type MinimalFillUp, type WithMetrics } from "./efficiency";

export interface FuelComparisonFillUp extends WithMetrics<MinimalFillUp> {
	totalPrice: number;
	fuelType: FuelType;
}

export interface FuelTypeStats {
	fuelType: FuelType;
	/** Weighted avg km/L over legs (adjacent full-tank pairs) closed by this fuel. */
	avgKmPerL: number | null;
	/** tankCapacityLiters * avgKmPerL — "how far a full tank of this fuel lasts". Null if capacity is unknown. */
	estimatedAutonomyKm: number | null;
	/** Total distance covered by legs closed by this fuel. */
	distanceTraveledKm: number;
	/** Sample size behind the two numbers above — gates recommendation reliability. */
	intervalCount: number;
	/** totalPrice/liters of the single most recent fill-up of this fuel. */
	latestPricePerLiter: number | null;
	/** date ('YYYY-MM-DD') of the single most recent fill-up of this fuel. */
	latestFillUpDate: string | null;
	/** latestPricePerLiter / avgKmPerL — "what would a km cost me if I filled up with this today". */
	avgCostPerKm: number | null;
	/** sum(totalPrice)/sum(liters) across every fill-up of this fuel (historical, not interval-gated). */
	avgFuelPrice: number | null;
	totalSpent: number;
	totalLiters: number;
	fillUpCount: number;
}

/**
 * A "leg" is a row with a defined `efficiencyKmPerL` (an adjacent full-tank
 * pair), attributed to its own `fuelType` — the fuel poured at the closing
 * fill-up of that leg. `totalSpent`/`totalLiters`/`fillUpCount`/`avgFuelPrice`
 * use every row of this fuel type (not just legs), since those aren't
 * consumption math.
 */
export function computeFuelTypeStats(
	rows: readonly FuelComparisonFillUp[],
	fuelType: FuelType,
	tankCapacityLiters?: number | null,
): FuelTypeStats {
	const legs = rows.filter((r) => r.efficiencyKmPerL !== null && r.fuelType === fuelType);

	const distanceTraveledKm = legs.reduce((sum, r) => sum + (r.distanceSincePreviousKm ?? 0), 0);
	const litersSum = legs.reduce((sum, r) => sum + r.liters, 0);
	const avgKmPerL = litersSum > 0 ? distanceTraveledKm / litersSum : null;
	const estimatedAutonomyKm =
		tankCapacityLiters !== null && tankCapacityLiters !== undefined && avgKmPerL !== null
			? tankCapacityLiters * avgKmPerL
			: null;

	const fuelRows = rows.filter((r) => r.fuelType === fuelType);
	const totalSpent = fuelRows.reduce((sum, r) => sum + r.totalPrice, 0);
	const totalLiters = fuelRows.reduce((sum, r) => sum + r.liters, 0);
	const avgFuelPrice = totalLiters > 0 ? totalSpent / totalLiters : null;

	const latestRow = fuelRows.reduce<FuelComparisonFillUp | null>((latest, r) => {
		if (!latest) return r;
		if (r.date !== latest.date) return r.date > latest.date ? r : latest;
		return r.id > latest.id ? r : latest;
	}, null);
	const latestPricePerLiter = latestRow && latestRow.liters > 0 ? latestRow.totalPrice / latestRow.liters : null;
	const latestFillUpDate = latestRow?.date ?? null;
	const avgCostPerKm = latestPricePerLiter !== null && avgKmPerL ? latestPricePerLiter / avgKmPerL : null;

	return {
		fuelType,
		avgKmPerL,
		estimatedAutonomyKm,
		distanceTraveledKm,
		intervalCount: legs.length,
		latestPricePerLiter,
		latestFillUpDate,
		avgCostPerKm,
		avgFuelPrice,
		totalSpent,
		totalLiters,
		fillUpCount: fuelRows.length,
	};
}

/** intervalCount (the lower of the two fuels'): <low is "low", [low,high] is "medium", >high is "high". */
export const CONFIDENCE_THRESHOLDS = { low: 5, high: 15 } as const;

export type FuelConfidence = "low" | "medium" | "high";

/** The traditional Brazilian flex-fuel rule of thumb: ethanol is worth it below 70% of the gasoline price. */
export const TRADITIONAL_ETHANOL_RATIO = 0.7;

/** Within this relative gap, treat the two fuels' cost/km as a tie rather than picking a "winner". */
const TIE_THRESHOLD = 0.01;

export type FuelRecommendationReason = "insufficient-data" | "gasoline-cheaper" | "ethanol-cheaper" | "tie";

export interface FuelRecommendation {
	recommended: FuelType | null;
	reason: FuelRecommendationReason;
	gasolineCostPerKm: number | null;
	ethanolCostPerKm: number | null;
	/** % the recommended fuel undercuts the other's cost/km. Null when there's no clear winner. */
	deltaPercent: number | null;
	/** Max ethanol price/L at which ethanol remains cheaper per km, given today's gasoline price. */
	breakEvenEthanolPricePerLiter: number | null;
	/** Max gasoline price/L at which gasoline remains cheaper per km, given today's ethanol price. */
	breakEvenGasolinePricePerLiter: number | null;
	/** ethanol.avgKmPerL / gasoline.avgKmPerL — this vehicle's own "worth it" ratio, vs. the traditional 70% rule. */
	personalizedEthanolRatio: number | null;
	/** ethanolPrice / gasolinePrice from the prices passed in, for comparing against personalizedEthanolRatio. */
	todayPriceRatio: number | null;
	/** Sample-size confidence behind the two avgKmPerL figures. Null iff reason is "insufficient-data". */
	confidence: FuelConfidence | null;
}

function classifyConfidence(intervalCount: number): FuelConfidence {
	if (intervalCount > CONFIDENCE_THRESHOLDS.high) return "high";
	if (intervalCount >= CONFIDENCE_THRESHOLDS.low) return "medium";
	return "low";
}

/**
 * Pure price comparison: takes each fuel's already-computed historical stats plus a price pair —
 * today's pump prices, or a fuel's latestPricePerLiter, or anything else — so the same function
 * powers both a "what if I filled up today" calculator and a "based on last recorded prices" glance.
 */
export function computeFuelRecommendation(
	gasoline: FuelTypeStats,
	ethanol: FuelTypeStats,
	prices: { gasoline: number; ethanol: number },
): FuelRecommendation {
	if (gasoline.avgKmPerL === null || ethanol.avgKmPerL === null) {
		return {
			recommended: null,
			reason: "insufficient-data",
			gasolineCostPerKm: null,
			ethanolCostPerKm: null,
			deltaPercent: null,
			breakEvenEthanolPricePerLiter: null,
			breakEvenGasolinePricePerLiter: null,
			personalizedEthanolRatio: null,
			todayPriceRatio: null,
			confidence: null,
		};
	}

	const gasolineCostPerKm = prices.gasoline / gasoline.avgKmPerL;
	const ethanolCostPerKm = prices.ethanol / ethanol.avgKmPerL;
	const breakEvenEthanolPricePerLiter = prices.gasoline * (ethanol.avgKmPerL / gasoline.avgKmPerL);
	const breakEvenGasolinePricePerLiter = prices.ethanol * (gasoline.avgKmPerL / ethanol.avgKmPerL);
	const personalizedEthanolRatio = ethanol.avgKmPerL / gasoline.avgKmPerL;
	const todayPriceRatio = prices.ethanol / prices.gasoline;
	const confidence = classifyConfidence(Math.min(gasoline.intervalCount, ethanol.intervalCount));

	const common = {
		gasolineCostPerKm,
		ethanolCostPerKm,
		breakEvenEthanolPricePerLiter,
		breakEvenGasolinePricePerLiter,
		personalizedEthanolRatio,
		todayPriceRatio,
		confidence,
	};

	const higher = Math.max(gasolineCostPerKm, ethanolCostPerKm);
	const lower = Math.min(gasolineCostPerKm, ethanolCostPerKm);

	if ((higher - lower) / higher < TIE_THRESHOLD) {
		return { recommended: null, reason: "tie", deltaPercent: 0, ...common };
	}

	const recommended: FuelType = gasolineCostPerKm < ethanolCostPerKm ? "gasoline" : "ethanol";
	const reason: FuelRecommendationReason = recommended === "gasoline" ? "gasoline-cheaper" : "ethanol-cheaper";
	const deltaPercent = ((higher - lower) / higher) * 100;

	return { recommended, reason, deltaPercent, ...common };
}

export interface FuelEfficiencyTrend {
	/** Weighted avg km/L over just the most recent `windowSize` intervals. */
	recentAvgKmPerL: number | null;
	/** Weighted avg km/L over every interval opened by this fuel. */
	lifetimeAvgKmPerL: number | null;
	/** (recent - lifetime) / lifetime * 100. */
	deltaPercent: number | null;
	direction: "up" | "down" | "flat" | null;
	/** How many recent intervals actually went into recentAvgKmPerL (<= windowSize). */
	sampleSize: number;
	/** Gates whether the UI should render a trend at all — too little history makes the comparison meaningless. */
	hasEnoughHistory: boolean;
}

const TREND_WINDOW = 3;

/** |deltaPercent| below this is shown as "flat" rather than up/down. */
const TREND_FLAT_THRESHOLD_PERCENT = 2;

function weightedAvgKmPerL(intervals: readonly { distanceKm: number; litersSum: number }[]): number | null {
	const distanceKm = intervals.reduce((sum, i) => sum + i.distanceKm, 0);
	const litersSum = intervals.reduce((sum, i) => sum + i.litersSum, 0);
	return litersSum > 0 ? distanceKm / litersSum : null;
}

/**
 * Compares a fuel's recent efficiency (last `windowSize` legs) against its
 * lifetime average, to answer "is this vehicle getting more or less efficient
 * lately". Same closing-row attribution as computeFuelTypeStats. Legs are
 * sorted by odometer so `.slice(-windowSize)` actually means "most recent".
 */
export function computeFuelEfficiencyTrend(
	rows: readonly FuelComparisonFillUp[],
	fuelType: FuelType,
	windowSize = TREND_WINDOW,
): FuelEfficiencyTrend {
	const sorted = sortByOdometer(rows);
	const intervals = sorted
		.filter((r) => r.efficiencyKmPerL !== null && r.fuelType === fuelType)
		.map((r) => ({ distanceKm: r.distanceSincePreviousKm ?? 0, litersSum: r.liters }));

	const recentIntervals = intervals.slice(-windowSize);
	const recentAvgKmPerL = weightedAvgKmPerL(recentIntervals);
	const lifetimeAvgKmPerL = weightedAvgKmPerL(intervals);

	const hasEnoughHistory = intervals.length >= windowSize + 2;

	if (!hasEnoughHistory || recentAvgKmPerL === null || lifetimeAvgKmPerL === null) {
		return {
			recentAvgKmPerL,
			lifetimeAvgKmPerL,
			deltaPercent: null,
			direction: null,
			sampleSize: recentIntervals.length,
			hasEnoughHistory,
		};
	}

	const deltaPercent = ((recentAvgKmPerL - lifetimeAvgKmPerL) / lifetimeAvgKmPerL) * 100;
	const direction: FuelEfficiencyTrend["direction"] =
		Math.abs(deltaPercent) < TREND_FLAT_THRESHOLD_PERCENT ? "flat" : deltaPercent > 0 ? "up" : "down";

	return {
		recentAvgKmPerL,
		lifetimeAvgKmPerL,
		deltaPercent,
		direction,
		sampleSize: recentIntervals.length,
		hasEnoughHistory,
	};
}

export interface MonthlyFuelPricePoint {
	month: string; // 'YYYY-MM'
	gasoline: number | null;
	ethanol: number | null;
}

/**
 * Avg price/L per fuel per month (sum totalPrice / sum liters within the
 * month+fuel bucket) — a fuel with no purchases that month is left `null`
 * rather than interpolated, since we don't know what it would have cost.
 */
export function computeMonthlyFuelPriceTrend(rows: readonly FuelComparisonFillUp[]): MonthlyFuelPricePoint[] {
	const months = groupBy(rows, (r) => r.date.slice(0, 7));

	return [...months.entries()]
		.map(([month, monthRows]) => {
			const point: MonthlyFuelPricePoint = { month, gasoline: null, ethanol: null };
			for (const fuelType of FUEL_TYPES) {
				const fuelRows = monthRows.filter((r) => r.fuelType === fuelType);
				const liters = fuelRows.reduce((sum, r) => sum + r.liters, 0);
				if (liters > 0) {
					point[fuelType] = fuelRows.reduce((sum, r) => sum + r.totalPrice, 0) / liters;
				}
			}
			return point;
		})
		.sort((a, b) => a.month.localeCompare(b.month));
}

export interface FuelEfficiencyPoint {
	date: string;
	gasoline: number | null;
	ethanol: number | null;
}

/**
 * One point per leg (row with a defined efficiencyKmPerL), sorted by odometer,
 * value placed under whichever fuel closed that leg and null for the other —
 * feeds a 2-line chart via MultiSeriesLineChart, whose connectNulls handles
 * each line skipping over the other fuel's points.
 */
export function computeFuelEfficiencyPoints(rows: readonly FuelComparisonFillUp[]): FuelEfficiencyPoint[] {
	const legs = sortByOdometer(rows).filter((r) => r.efficiencyKmPerL !== null);

	return legs.map((r) => ({
		date: r.date,
		gasoline: r.fuelType === "gasoline" ? r.efficiencyKmPerL! : null,
		ethanol: r.fuelType === "ethanol" ? r.efficiencyKmPerL! : null,
	}));
}
