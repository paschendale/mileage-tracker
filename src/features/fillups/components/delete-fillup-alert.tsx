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
import { deleteFillUpAction } from "../actions/delete-fillup";

interface DeleteFillUpAlertProps {
	fillUpId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DeleteFillUpAlert({ fillUpId, open, onOpenChange }: DeleteFillUpAlertProps) {
	const { execute, isExecuting } = useAction(deleteFillUpAction, {
		onSuccess: () => {
			toast.success("Fill-up deleted");
			onOpenChange(false);
		},
		onError: ({ error }) => {
			toast.error(error.serverError ?? "Could not delete fill-up");
		},
	});

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete this fill-up?</AlertDialogTitle>
					<AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						disabled={isExecuting}
						onClick={(e) => {
							e.preventDefault();
							execute({ id: fillUpId });
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
