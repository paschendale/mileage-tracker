"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Vehicle } from "@/db/schema";
import { sanitizeDecimalInput } from "@/lib/format";
import { createVehicleAction } from "../actions/create-vehicle";
import { updateVehicleAction } from "../actions/update-vehicle";

interface VehicleFormDialogProps {
	mode: "create" | "edit";
	vehicle?: Vehicle;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function VehicleFormDialog({ mode, vehicle, open, onOpenChange }: VehicleFormDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{mode === "create" ? "Add vehicle" : "Edit vehicle"}</DialogTitle>
				</DialogHeader>
				{/* Keyed by vehicle so the form remounts with fresh initial state each
				time the dialog opens, instead of syncing state via an effect. */}
				{open && (
					<VehicleForm
						key={vehicle?.id ?? "create"}
						mode={mode}
						vehicle={vehicle}
						onDone={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

function VehicleForm({
	mode,
	vehicle,
	onDone,
}: {
	mode: "create" | "edit";
	vehicle?: Vehicle;
	onDone: () => void;
}) {
	const [name, setName] = useState(vehicle?.name ?? "");
	const [thumbnailUrl, setThumbnailUrl] = useState(vehicle?.thumbnailUrl ?? "");
	const [tankCapacityLiters, setTankCapacityLiters] = useState(
		vehicle?.tankCapacityLiters !== null && vehicle?.tankCapacityLiters !== undefined
			? String(vehicle.tankCapacityLiters)
			: "",
	);

	const createAction = useAction(createVehicleAction, {
		onSuccess: () => {
			toast.success("Vehicle added");
			onDone();
		},
		onError: ({ error }) => {
			toast.error(error.serverError ?? "Could not save vehicle");
		},
	});

	const updateAction = useAction(updateVehicleAction, {
		onSuccess: () => {
			toast.success("Vehicle updated");
			onDone();
		},
		onError: ({ error }) => {
			toast.error(error.serverError ?? "Could not save vehicle");
		},
	});

	const isExecuting = mode === "create" ? createAction.isExecuting : updateAction.isExecuting;

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const parsedCapacity = Number.parseFloat(tankCapacityLiters);
		const tankCapacity = tankCapacityLiters.trim() !== "" && Number.isFinite(parsedCapacity) ? parsedCapacity : null;

		if (mode === "create") {
			createAction.execute({ name, thumbnailUrl, tankCapacityLiters: tankCapacity });
		} else if (vehicle) {
			updateAction.execute({ id: vehicle.id, name, thumbnailUrl, tankCapacityLiters: tankCapacity });
		}
	}

	return (
		<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
			<div className="flex flex-col gap-1.5">
				<label htmlFor="vehicle-name" className="text-sm font-medium">
					Name
				</label>
				<Input
					id="vehicle-name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="e.g. Civic"
					autoFocus
				/>
			</div>
			<div className="flex flex-col gap-1.5">
				<label htmlFor="vehicle-thumbnail" className="text-sm font-medium">
					Thumbnail URL
				</label>
				<Input
					id="vehicle-thumbnail"
					value={thumbnailUrl}
					onChange={(e) => setThumbnailUrl(e.target.value)}
					placeholder="https://…"
				/>
			</div>
			<div className="flex flex-col gap-1.5">
				<label htmlFor="vehicle-tank-capacity" className="text-sm font-medium">
					Tank capacity (L)
				</label>
				<Input
					id="vehicle-tank-capacity"
					type="text"
					inputMode="decimal"
					value={tankCapacityLiters}
					onChange={(e) => setTankCapacityLiters(sanitizeDecimalInput(e.target.value))}
					placeholder="e.g. 50"
				/>
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isExecuting || name.trim().length === 0}>
					{isExecuting ? "Saving…" : "Save"}
				</Button>
			</DialogFooter>
		</form>
	);
}
