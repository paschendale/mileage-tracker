import { notFound } from "next/navigation";
import { getFillUpById } from "@/db/queries/fillups";
import { getVehicles } from "@/db/queries/vehicles";
import { FillUpForm } from "@/features/fillups/components/fillup-form";

export default async function EditFillUpPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const fillUpId = Number(id);

	const [fillUp, vehicles] = await Promise.all([getFillUpById(fillUpId), getVehicles()]);

	if (!fillUp) {
		notFound();
	}

	return (
		<div className="mx-auto max-w-lg p-6 md:p-8">
			<h1 className="mb-6 text-2xl font-semibold tracking-tight">Edit fill-up</h1>
			<FillUpForm mode="edit" fillUp={fillUp} vehicles={vehicles} defaultVehicleId={fillUp.vehicleId} />
		</div>
	);
}
