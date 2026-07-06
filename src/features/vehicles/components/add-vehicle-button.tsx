"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VehicleFormDialog } from "./vehicle-form-dialog";

export function AddVehicleButton() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button onClick={() => setOpen(true)}>
				<Plus className="size-4" />
				Add vehicle
			</Button>
			<VehicleFormDialog mode="create" open={open} onOpenChange={setOpen} />
		</>
	);
}
