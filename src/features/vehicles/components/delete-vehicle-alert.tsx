"use client";

import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Vehicle } from "@/db/schema";
import { deleteVehicleAction } from "../actions/delete-vehicle";

interface DeleteVehicleAlertProps {
	vehicle: Vehicle;
	fillUpCount: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DeleteVehicleAlert({ vehicle, fillUpCount, open, onOpenChange }: DeleteVehicleAlertProps) {
	const { execute, isExecuting } = useAction(deleteVehicleAction, {
		onSuccess: () => {
			toast.success(`${vehicle.name} deleted`);
			onOpenChange(false);
		},
		onError: ({ error }) => {
			toast.error(error.serverError ?? "Could not delete vehicle");
		},
	});

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete {vehicle.name}?</AlertDialogTitle>
					<AlertDialogDescription>
						{fillUpCount > 0
							? `This will also permanently delete ${fillUpCount} fill-up record${fillUpCount === 1 ? "" : "s"} for this vehicle. This action cannot be undone.`
							: "This action cannot be undone."}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						disabled={isExecuting}
						onClick={(e) => {
							e.preventDefault();
							execute({ id: vehicle.id });
						}}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{isExecuting ? "Deleting…" : "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
