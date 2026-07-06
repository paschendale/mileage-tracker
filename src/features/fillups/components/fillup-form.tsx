"use client";

import { CalendarIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FUEL_TYPES, type FillUp, type FuelType } from "@/db/schema";
import type { Vehicle } from "@/db/schema";
import { dateToIsoString, formatCurrency, formatDateDisplay, isoStringToDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { createFillUpAction } from "../actions/create-fillup";
import { updateFillUpAction } from "../actions/update-fillup";

const FUEL_TYPE_LABELS: Record<FuelType, string> = {
	gasoline: "Gasoline",
	ethanol: "Ethanol",
	diesel: "Diesel",
	flex: "Flex",
	cng: "CNG",
};

interface FillUpFormProps {
	mode: "create" | "edit";
	fillUp?: FillUp;
	vehicles: Vehicle[];
	defaultVehicleId: number;
}

export function FillUpForm({ mode, fillUp, vehicles, defaultVehicleId }: FillUpFormProps) {
	const router = useRouter();

	const [vehicleId, setVehicleId] = useState(fillUp?.vehicleId ?? defaultVehicleId);
	const [date, setDate] = useState(fillUp?.date ?? dateToIsoString(new Date()));
	const [odometerKm, setOdometerKm] = useState(fillUp ? String(fillUp.odometerKm) : "");
	const [fuelType, setFuelType] = useState<FuelType>(fillUp?.fuelType ?? "gasoline");
	const [liters, setLiters] = useState(fillUp ? String(fillUp.liters) : "");
	const [totalPrice, setTotalPrice] = useState(fillUp ? String(fillUp.totalPrice) : "");
	const [isFullTank, setIsFullTank] = useState(fillUp?.isFullTank ?? true);
	const [notes, setNotes] = useState(fillUp?.notes ?? "");

	const litersValue = Number.parseFloat(liters);
	const totalPriceValue = Number.parseFloat(totalPrice);
	const pricePerLiter =
		Number.isFinite(litersValue) && litersValue > 0 && Number.isFinite(totalPriceValue)
			? totalPriceValue / litersValue
			: null;

	function handleSuccess(message: string) {
		toast.success(message);
		router.push("/fillups");
	}

	const createAction = useAction(createFillUpAction, {
		onSuccess: () => handleSuccess("Fill-up added"),
		onError: ({ error }) => toast.error(error.serverError ?? "Could not save fill-up"),
	});

	const updateAction = useAction(updateFillUpAction, {
		onSuccess: () => handleSuccess("Fill-up updated"),
		onError: ({ error }) => toast.error(error.serverError ?? "Could not save fill-up"),
	});

	const isExecuting = mode === "create" ? createAction.isExecuting : updateAction.isExecuting;

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		const input = {
			vehicleId,
			date,
			odometerKm: Number.parseInt(odometerKm, 10),
			fuelType,
			liters: litersValue,
			totalPrice: totalPriceValue,
			isFullTank,
			notes: notes.trim() || undefined,
		};

		if (mode === "create") {
			createAction.execute(input);
		} else if (fillUp) {
			updateAction.execute({ ...input, id: fillUp.id });
		}
	}

	const isValid =
		odometerKm !== "" &&
		Number.isFinite(Number.parseInt(odometerKm, 10)) &&
		Number.isFinite(litersValue) &&
		litersValue > 0 &&
		Number.isFinite(totalPriceValue) &&
		totalPriceValue > 0;

	return (
		<Card>
			<CardContent className="pt-6">
				<form className="flex flex-col gap-5" onSubmit={handleSubmit}>
					{vehicles.length > 1 && (
						<div className="flex flex-col gap-1.5">
							<label htmlFor="fillup-vehicle" className="text-sm font-medium">
								Vehicle
							</label>
							<select
								id="fillup-vehicle"
								value={vehicleId}
								onChange={(e) => setVehicleId(Number(e.target.value))}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
							>
								{vehicles.map((vehicle) => (
									<option key={vehicle.id} value={vehicle.id}>
										{vehicle.name}
									</option>
								))}
							</select>
						</div>
					)}

					<div className="grid grid-cols-2 gap-4">
						<div className="flex flex-col gap-1.5">
							<span className="text-sm font-medium">Date</span>
							<Popover>
								<PopoverTrigger
									render={
										<Button variant="outline" className="justify-start font-normal">
											<CalendarIcon className="size-4" />
											{formatDateDisplay(date)}
										</Button>
									}
								/>
								<PopoverContent className="w-auto p-0">
									<Calendar
										mode="single"
										selected={isoStringToDate(date)}
										onSelect={(selected) => selected && setDate(dateToIsoString(selected))}
										autoFocus
									/>
								</PopoverContent>
							</Popover>
						</div>

						<div className="flex flex-col gap-1.5">
							<label htmlFor="fillup-odometer" className="text-sm font-medium">
								Odometer (km)
							</label>
							<Input
								id="fillup-odometer"
								type="number"
								inputMode="numeric"
								min={0}
								value={odometerKm}
								onChange={(e) => setOdometerKm(e.target.value)}
								placeholder="e.g. 12000"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<span className="text-sm font-medium">Fuel type</span>
						<ToggleGroup
							value={[fuelType]}
							onValueChange={(values) => {
								const next = values[0];
								if (next) setFuelType(next as FuelType);
							}}
							className="w-full"
						>
							{FUEL_TYPES.map((type) => (
								<ToggleGroupItem key={type} value={type} className="flex-1">
									{FUEL_TYPE_LABELS[type]}
								</ToggleGroupItem>
							))}
						</ToggleGroup>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="flex flex-col gap-1.5">
							<label htmlFor="fillup-liters" className="text-sm font-medium">
								Liters
							</label>
							<Input
								id="fillup-liters"
								type="number"
								inputMode="decimal"
								step="0.01"
								min={0}
								value={liters}
								onChange={(e) => setLiters(e.target.value)}
								placeholder="e.g. 40.5"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label htmlFor="fillup-total-price" className="text-sm font-medium">
								Total price
							</label>
							<Input
								id="fillup-total-price"
								type="number"
								inputMode="decimal"
								step="0.01"
								min={0}
								value={totalPrice}
								onChange={(e) => setTotalPrice(e.target.value)}
								placeholder="e.g. 250.00"
							/>
						</div>
					</div>

					<p className={cn("text-sm text-muted-foreground", pricePerLiter === null && "invisible")}>
						{pricePerLiter !== null ? `${formatCurrency(pricePerLiter)} / liter` : "—"}
					</p>

					<label className="flex items-center gap-2.5">
						<Checkbox checked={isFullTank} onCheckedChange={(checked) => setIsFullTank(checked === true)} />
						<span className="text-sm font-medium">Full tank</span>
					</label>

					<div className="flex flex-col gap-1.5">
						<label htmlFor="fillup-notes" className="text-sm font-medium">
							Notes
						</label>
						<textarea
							id="fillup-notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={3}
							placeholder="Optional"
							className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
						/>
					</div>

					<div className="flex justify-end gap-2">
						<Button type="button" variant="outline" onClick={() => router.push("/fillups")}>
							Cancel
						</Button>
						<Button type="submit" disabled={!isValid || isExecuting}>
							{isExecuting ? "Saving…" : "Save"}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
