import { getSelectedVehicleContext } from "@/lib/selected-vehicle";
import { VehicleContextSync } from "@/features/vehicles/components/vehicle-context-sync";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { TopNav } from "./top-nav";

export async function AppShell({ children }: { children: React.ReactNode }) {
	const { vehicles, selectedVehicle } = await getSelectedVehicleContext();

	return (
		<div className="flex min-h-svh">
			<Sidebar />
			<div className="flex flex-1 flex-col">
				<TopNav vehicles={vehicles} selectedVehicle={selectedVehicle} />
				<main className="flex-1 pb-16 md:pb-0">{children}</main>
			</div>
			<BottomNav />
			<VehicleContextSync selectedVehicleId={selectedVehicle?.id ?? null} />
		</div>
	);
}
