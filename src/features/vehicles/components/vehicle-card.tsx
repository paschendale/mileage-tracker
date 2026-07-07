"use client";

import { MoreVertical } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Vehicle } from "@/db/schema";
import { DeleteVehicleAlert } from "./delete-vehicle-alert";
import { VehicleFormDialog } from "./vehicle-form-dialog";
import { VehicleThumbnail } from "./vehicle-thumbnail";

export function VehicleCard({ vehicle, fillUpCount }: { vehicle: Vehicle; fillUpCount: number }) {
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);

	return (
		<>
			<Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								variant="ghost"
								size="icon"
								className="absolute top-2 right-2 size-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
							>
								<MoreVertical className="size-4" />
								<span className="sr-only">Vehicle options</span>
							</Button>
						}
					/>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => setEditOpen(true)}>Edit</DropdownMenuItem>
						<DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<CardContent className="flex flex-col items-center gap-3 py-8">
					<VehicleThumbnail vehicle={vehicle} className="size-16" />
					<div className="text-center">
						<p className="font-medium">{vehicle.name}</p>
						<p className="text-sm text-muted-foreground">
							{fillUpCount} fill-up{fillUpCount === 1 ? "" : "s"}
							{vehicle.tankCapacityLiters !== null ? ` · ${vehicle.tankCapacityLiters} L tank` : ""}
						</p>
					</div>
				</CardContent>
			</Card>

			<VehicleFormDialog mode="edit" vehicle={vehicle} open={editOpen} onOpenChange={setEditOpen} />
			<DeleteVehicleAlert
				vehicle={vehicle}
				fillUpCount={fillUpCount}
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
			/>
		</>
	);
}
