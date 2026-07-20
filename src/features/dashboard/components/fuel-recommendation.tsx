"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FuelType, TripType } from "@/db/schema";
import { formatCurrency, formatDateDisplay, sanitizeDecimalInput } from "@/lib/format";
import { computeFuelRecommendation, type FuelConfidence, type FuelTypeStats } from "@/services/fuel-comparison";
import { FuelRecommendationScience } from "./fuel-recommendation-science";

const FUEL_LABELS: Record<FuelType, string> = { gasoline: "Gasoline", ethanol: "Ethanol" };
const TRIP_LABELS: Record<TripType, string> = { road: "Road", city: "City" };

const CONFIDENCE_LABELS: Record<FuelConfidence, string> = {
	low: "Low confidence",
	medium: "Medium confidence",
	high: "High confidence",
};

type PriceMode = "recorded" | "custom";

function defaultPriceInput(stats: FuelTypeStats): string {
	return stats.latestPricePerLiter !== null ? stats.latestPricePerLiter.toFixed(2) : "";
}

export function FuelRecommendation({
	tripType,
	perFuel,
}: {
	tripType: TripType;
	perFuel: Record<FuelType, FuelTypeStats>;
}) {
	const idPrefix = `fuel-rec-${tripType}`;
	const [mode, setMode] = useState<PriceMode>("recorded");
	const [gasolinePrice, setGasolinePrice] = useState(() => defaultPriceInput(perFuel.gasoline));
	const [ethanolPrice, setEthanolPrice] = useState(() => defaultPriceInput(perFuel.ethanol));

	const recordedPrices =
		perFuel.gasoline.latestPricePerLiter !== null && perFuel.ethanol.latestPricePerLiter !== null
			? { gasoline: perFuel.gasoline.latestPricePerLiter, ethanol: perFuel.ethanol.latestPricePerLiter }
			: null;

	const gasolinePriceValue = Number.parseFloat(gasolinePrice);
	const ethanolPriceValue = Number.parseFloat(ethanolPrice);
	const customPrices =
		Number.isFinite(gasolinePriceValue) && gasolinePriceValue > 0 && Number.isFinite(ethanolPriceValue) && ethanolPriceValue > 0
			? { gasoline: gasolinePriceValue, ethanol: ethanolPriceValue }
			: null;

	const activePrices = mode === "recorded" ? recordedPrices : customPrices;
	const recommendation = activePrices ? computeFuelRecommendation(perFuel.gasoline, perFuel.ethanol, activePrices) : null;

	function resetCustomPrices() {
		setGasolinePrice(defaultPriceInput(perFuel.gasoline));
		setEthanolPrice(defaultPriceInput(perFuel.ethanol));
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Fuel recommendation — {TRIP_LABELS[tripType]}</CardTitle>
				{recommendation?.confidence && (
					<CardAction>
						<Badge variant="secondary">{CONFIDENCE_LABELS[recommendation.confidence]}</Badge>
					</CardAction>
				)}
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<Tabs value={mode} onValueChange={(value) => setMode(value as PriceMode)}>
					<TabsList>
						<TabsTrigger value="recorded">Last recorded</TabsTrigger>
						<TabsTrigger value="custom">Custom prices</TabsTrigger>
					</TabsList>

					<TabsContent value="recorded" className="mt-3">
						{recordedPrices ? (
							<p className="text-sm text-muted-foreground">
								Using last recorded prices: {FUEL_LABELS.gasoline} {formatCurrency(recordedPrices.gasoline)}/L
								{perFuel.gasoline.latestFillUpDate && ` (filled ${formatDateDisplay(perFuel.gasoline.latestFillUpDate)})`}, {FUEL_LABELS.ethanol}{" "}
								{formatCurrency(recordedPrices.ethanol)}/L
								{perFuel.ethanol.latestFillUpDate && ` (filled ${formatDateDisplay(perFuel.ethanol.latestFillUpDate)})`}
							</p>
						) : (
							<p className="text-sm text-muted-foreground">No recorded price yet for both fuels.</p>
						)}
					</TabsContent>

					<TabsContent value="custom" className="mt-3">
						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-1.5">
								<label htmlFor={`${idPrefix}-gasoline`} className="text-sm font-medium">
									Gasoline (R$/L)
								</label>
								<Input
									id={`${idPrefix}-gasoline`}
									type="text"
									inputMode="decimal"
									value={gasolinePrice}
									onChange={(e) => setGasolinePrice(sanitizeDecimalInput(e.target.value))}
									placeholder="e.g. 6.49"
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<label htmlFor={`${idPrefix}-ethanol`} className="text-sm font-medium">
									Ethanol (R$/L)
								</label>
								<Input
									id={`${idPrefix}-ethanol`}
									type="text"
									inputMode="decimal"
									value={ethanolPrice}
									onChange={(e) => setEthanolPrice(sanitizeDecimalInput(e.target.value))}
									placeholder="e.g. 4.79"
								/>
							</div>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="mt-2 h-auto p-0 font-normal text-muted-foreground hover:bg-transparent hover:underline"
							onClick={resetCustomPrices}
						>
							Reset to last recorded
						</Button>
					</TabsContent>
				</Tabs>

				{recommendation ? (
					<FuelRecommendationScience recommendation={recommendation} gasoline={perFuel.gasoline} ethanol={perFuel.ethanol} />
				) : (
					<p className="text-sm text-muted-foreground">
						{mode === "recorded" ? "No recorded price yet for both fuels." : "Enter both prices to see a recommendation."}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
