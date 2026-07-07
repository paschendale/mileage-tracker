import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";
import { MIN_RELIABLE_INTERVALS, type FuelRecommendation as FuelRecommendationData } from "@/services/fuel-comparison";

const FUEL_LABELS = { gasoline: "Gasoline", ethanol: "Ethanol" } as const;

function FuelColumn({ label, stats }: { label: string; stats: FuelRecommendationData["gasoline"] }) {
	return (
		<div className="flex flex-col gap-1 rounded-lg border p-3">
			<p className="text-sm font-medium">{label}</p>
			<dl className="flex flex-col gap-0.5 text-xs text-muted-foreground">
				<div className="flex justify-between gap-2">
					<dt>Latest price/L</dt>
					<dd>{stats.latestPricePerLiter !== null ? formatCurrency(stats.latestPricePerLiter) : "—"}</dd>
				</div>
				<div className="flex justify-between gap-2">
					<dt>Avg. km/L</dt>
					<dd>{stats.avgKmPerL !== null ? formatNumber(stats.avgKmPerL, { maximumFractionDigits: 2 }) : "—"}</dd>
				</div>
				<div className="flex justify-between gap-2">
					<dt>Cost/km</dt>
					<dd>{stats.avgCostPerKm !== null ? formatCurrency(stats.avgCostPerKm) : "—"}</dd>
				</div>
			</dl>
		</div>
	);
}

export function FuelRecommendation({ recommendation }: { recommendation: FuelRecommendationData }) {
	const { gasoline, ethanol, recommended, reason, deltaPercent } = recommendation;

	let headline: string;
	if (reason === "insufficient-data") {
		const short = gasoline.intervalCount < MIN_RELIABLE_INTERVALS ? gasoline : ethanol;
		headline = `Not enough full-tank history yet to compare fuels reliably. ${FUEL_LABELS[short.fuelType]} has only ${short.intervalCount} recorded interval${short.intervalCount === 1 ? "" : "s"} — log at least ${MIN_RELIABLE_INTERVALS} to see a recommendation.`;
	} else if (reason === "tie") {
		headline = "Gasoline and ethanol currently cost about the same per km — no clear winner.";
	} else {
		const other = recommended === "gasoline" ? "ethanol" : "gasoline";
		headline = `${FUEL_LABELS[recommended!]} is currently more worth it — about ${formatNumber(deltaPercent!, { maximumFractionDigits: 1 })}% cheaper per km than ${FUEL_LABELS[other]}.`;
	}

	return (
		<Card>
			<CardContent className="flex flex-col gap-3 pt-6">
				<p className="text-sm font-medium">{headline}</p>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<FuelColumn label="Gasoline" stats={gasoline} />
					<FuelColumn label="Ethanol" stats={ethanol} />
				</div>
			</CardContent>
		</Card>
	);
}
