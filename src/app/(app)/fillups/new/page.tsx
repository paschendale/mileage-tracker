import { getVehicles } from "@/db/queries/vehicles";
import { FillUpForm } from "@/features/fillups/components/fillup-form";
import { getSelectedVehicleId } from "@/lib/selected-vehicle";

export default async function NewFillUpPage() {
	const [vehicles, selectedVehicleId] = await Promise.all([getVehicles(), getSelectedVehicleId()]);

	return (
		<div className="mx-auto max-w-lg p-6 md:p-8">
			<h1 className="mb-6 text-2xl font-semibold tracking-tight">Add fill-up</h1>
			<FillUpForm mode="create" vehicles={vehicles} defaultVehicleId={selectedVehicleId ?? 0} />
		</div>
	);
}
