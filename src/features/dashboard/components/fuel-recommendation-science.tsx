import { Check, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { FuelType } from "@/db/schema";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
	TRADITIONAL_ETHANOL_RATIO,
	type FuelRecommendation,
	type FuelTypeStats,
} from "@/services/fuel-comparison";
import { cn } from "@/lib/utils";

const FUEL_LABELS: Record<FuelType, string> = { gasoline: "Gasoline", ethanol: "Ethanol" };

function buildHeadline(recommendation: FuelRecommendation): string {
	const { reason, recommended, gasolineCostPerKm, ethanolCostPerKm, deltaPercent } = recommendation;

	if (reason === "tie") {
		return "Gasoline and ethanol currently cost about the same per km — no clear winner.";
	}
	if (!recommended || gasolineCostPerKm === null || ethanolCostPerKm === null || deltaPercent === null) {
		return "";
	}

	const winnerCost = recommended === "gasoline" ? gasolineCostPerKm : ethanolCostPerKm;
	const otherCost = recommended === "gasoline" ? ethanolCostPerKm : gasolineCostPerKm;
	const otherFuel = recommended === "gasoline" ? "ethanol" : "gasoline";

	return `${FUEL_LABELS[recommended]} is estimated to cost ${formatCurrency(winnerCost)}/km vs. ${formatCurrency(otherCost)}/km for ${otherFuel} — about ${formatNumber(deltaPercent, { maximumFractionDigits: 1 })}% cheaper per km, based on your vehicle's fuel history.`;
}

function CostBar({ label, value, maxValue, isWinner }: { label: string; value: number; maxValue: number; isWinner: boolean }) {
	const widthPercent = maxValue > 0 ? Math.max((value / maxValue) * 100, 4) : 0;
	return (
		<div className="flex items-center gap-3">
			<div className="flex w-20 shrink-0 items-center gap-1">
				{isWinner && <Check className="size-3.5 shrink-0 text-primary" />}
				<span className={cn("truncate text-sm", isWinner ? "font-medium text-primary" : "text-muted-foreground")}>{label}</span>
			</div>
			<div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
				<div
					className={cn("h-full rounded-full transition-all duration-500 ease-out", isWinner ? "bg-primary" : "bg-muted-foreground/40")}
					style={{ width: `${widthPercent}%` }}
				/>
			</div>
			<span className="w-24 shrink-0 text-right text-sm tabular-nums text-muted-foreground">{formatCurrency(value)}/km</span>
		</div>
	);
}

function BreakEvenMeter({ todayPrice, breakEvenPrice }: { todayPrice: number; breakEvenPrice: number }) {
	const max = Math.max(todayPrice, breakEvenPrice, 0.01) * 1.3;
	const todayPercent = Math.min((todayPrice / max) * 100, 100);
	const breakEvenPercent = Math.min((breakEvenPrice / max) * 100, 100);
	const belowBreakEven = todayPrice <= breakEvenPrice;

	return (
		<div className="flex flex-col gap-2">
			<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
				Break-even — ethanol stays worth it below this price
			</p>
			<div className="relative h-1.5 rounded-full bg-muted">
				<div
					className="absolute top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-foreground/40 transition-all duration-500 ease-out"
					style={{ left: `${breakEvenPercent}%` }}
				/>
				<div
					className={cn(
						"absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background transition-all duration-500 ease-out",
						belowBreakEven ? "bg-primary" : "bg-muted-foreground",
					)}
					style={{ left: `${todayPercent}%` }}
				/>
			</div>
			<div className="flex justify-between text-xs tabular-nums text-muted-foreground">
				<span>Today {formatCurrency(todayPrice)}</span>
				<span>Break-even {formatCurrency(breakEvenPrice)}</span>
			</div>
		</div>
	);
}

function RatioMeter({ todayRatioPercent, personalizedRatioPercent }: { todayRatioPercent: number; personalizedRatioPercent: number }) {
	const traditionalPercent = TRADITIONAL_ETHANOL_RATIO * 100;
	const clampedTodayPercent = Math.min(todayRatioPercent, 100);
	const clampedPersonalizedPercent = Math.min(personalizedRatioPercent, 100);
	const worthIt = todayRatioPercent <= personalizedRatioPercent;

	return (
		<div className="flex flex-col gap-2">
			<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
				Your vehicle&apos;s ratio — vs. the generic &quot;70% rule&quot;
			</p>
			<div className="relative h-1.5 rounded-full bg-muted">
				<div
					className="absolute top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-muted-foreground/50"
					style={{ left: `${traditionalPercent}%` }}
				/>
				<div
					className="absolute top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-foreground/60 transition-all duration-500 ease-out"
					style={{ left: `${clampedPersonalizedPercent}%` }}
				/>
				<div
					className={cn(
						"absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background transition-all duration-500 ease-out",
						worthIt ? "bg-primary" : "bg-muted-foreground",
					)}
					style={{ left: `${clampedTodayPercent}%` }}
				/>
			</div>
			<div className="flex justify-between text-xs tabular-nums text-muted-foreground">
				<span>Today {formatNumber(todayRatioPercent, { maximumFractionDigits: 1 })}%</span>
				<span>70% traditional</span>
				<span>{formatNumber(personalizedRatioPercent, { maximumFractionDigits: 1 })}% your vehicle</span>
			</div>
			<p className="text-xs text-muted-foreground">
				Today&apos;s ratio is {worthIt ? "below" : "above"} your vehicle&apos;s{" "}
				{formatNumber(personalizedRatioPercent, { maximumFractionDigits: 1 })}% threshold, so{" "}
				{worthIt ? "ethanol wins here" : "gasoline wins here"} — even though the generic 70% rule would have said{" "}
				{todayRatioPercent <= traditionalPercent ? "ethanol" : "gasoline"}.
			</p>
		</div>
	);
}

const FORMULA_EXPLANATION =
	"cost/km = price per liter ÷ vehicle's avg km/L for that fuel\n" +
	"break-even ethanol price = gasoline price × (ethanol km/L ÷ gasoline km/L)\n" +
	"personalized ratio = ethanol km/L ÷ gasoline km/L";

export function FuelRecommendationScience({
	recommendation,
	gasoline,
	ethanol,
}: {
	recommendation: FuelRecommendation;
	gasoline: FuelTypeStats;
	ethanol: FuelTypeStats;
}) {
	if (recommendation.reason === "insufficient-data" || gasoline.avgKmPerL === null || ethanol.avgKmPerL === null) {
		return (
			<p className="text-sm text-muted-foreground">
				Not enough full-tank history yet — need at least one full-tank comparison for each fuel.
			</p>
		);
	}

	const {
		gasolineCostPerKm,
		ethanolCostPerKm,
		breakEvenEthanolPricePerLiter,
		personalizedEthanolRatio,
		todayPriceRatio,
	} = recommendation;
	// costPerKm = price / avgKmPerL, so price = costPerKm * avgKmPerL.
	const todayEthanolPrice = ethanolCostPerKm! * ethanol.avgKmPerL;
	const maxCostPerKm = Math.max(gasolineCostPerKm!, ethanolCostPerKm!);

	return (
		<div className="flex flex-col gap-5">
			<div className="flex items-start justify-between gap-2">
				<p className="text-sm font-medium">{buildHeadline(recommendation)}</p>
				<Popover>
					<PopoverTrigger
						render={
							<button type="button" className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="How this is calculated">
								<Info className="size-4" />
							</button>
						}
					/>
					<PopoverContent className="whitespace-pre-line text-xs">{FORMULA_EXPLANATION}</PopoverContent>
				</Popover>
			</div>

			<div className="flex flex-col gap-2">
				<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Cost per km</p>
				<CostBar label="Gasoline" value={gasolineCostPerKm!} maxValue={maxCostPerKm} isWinner={recommendation.recommended === "gasoline"} />
				<CostBar label="Ethanol" value={ethanolCostPerKm!} maxValue={maxCostPerKm} isWinner={recommendation.recommended === "ethanol"} />
			</div>

			<BreakEvenMeter todayPrice={todayEthanolPrice} breakEvenPrice={breakEvenEthanolPricePerLiter!} />

			<RatioMeter todayRatioPercent={todayPriceRatio! * 100} personalizedRatioPercent={personalizedEthanolRatio! * 100} />

			<p className="text-xs text-muted-foreground">
				Based on {gasoline.intervalCount} full-tank comparison{gasoline.intervalCount === 1 ? "" : "s"} for gasoline,{" "}
				{ethanol.intervalCount} for ethanol.
			</p>
		</div>
	);
}
