"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FUEL_TYPES, type FillUp, type FuelType } from "@/db/schema";
import type { WithMetrics } from "@/services/efficiency";
import type { FuelEfficiencyTrend, FuelTypeStats } from "@/services/fuel-comparison";
import { FuelStatsGrid } from "./fuel-stats-grid";

const FUEL_TYPE_LABELS: Record<FuelType, string> = {
	gasoline: "Gasoline",
	ethanol: "Ethanol",
};

const ChartSkeleton = () => <Skeleton className="h-[21.5rem] w-full rounded-xl" />;

const EfficiencyChart = dynamic(() => import("./charts/efficiency-chart").then((m) => m.EfficiencyChart), {
	ssr: false,
	loading: ChartSkeleton,
});
const FuelPriceChart = dynamic(() => import("./charts/fuel-price-chart").then((m) => m.FuelPriceChart), {
	ssr: false,
	loading: ChartSkeleton,
});

interface FuelSwitcherViewProps {
	fillUps: WithMetrics<FillUp>[];
	perFuel: Record<FuelType, FuelTypeStats>;
	efficiencyTrend: Record<FuelType, FuelEfficiencyTrend>;
	defaultFuelType: FuelType;
}

export function FuelSwitcherView({ fillUps, perFuel, efficiencyTrend, defaultFuelType }: FuelSwitcherViewProps) {
	const [selected, setSelected] = useState<FuelType>(defaultFuelType);

	const filtered = fillUps
		.filter((f) => f.fuelType === selected)
		.sort((a, b) => a.date.localeCompare(b.date));

	const efficiencyPoints = filtered
		.filter((f): f is typeof f & { efficiencyKmPerL: number } => f.efficiencyKmPerL !== null)
		.map((f) => ({ date: f.date, efficiencyKmPerL: f.efficiencyKmPerL }));

	const fuelPricePoints = filtered
		.filter((f) => f.liters > 0)
		.map((f) => ({ date: f.date, pricePerLiter: f.totalPrice / f.liters }));

	return (
		<div className="flex flex-col gap-4">
			<ToggleGroup
				value={[selected]}
				onValueChange={(values) => {
					const next = values[0];
					if (next) setSelected(next as FuelType);
				}}
			>
				{FUEL_TYPES.map((type) => (
					<ToggleGroupItem key={type} value={type}>
						{FUEL_TYPE_LABELS[type]}
					</ToggleGroupItem>
				))}
			</ToggleGroup>

			<FuelStatsGrid stats={perFuel[selected]} trend={efficiencyTrend[selected]} />

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<EfficiencyChart points={efficiencyPoints} />
				<FuelPriceChart points={fuelPricePoints} />
			</div>
		</div>
	);
}
