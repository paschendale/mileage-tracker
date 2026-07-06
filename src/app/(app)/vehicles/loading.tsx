import { VehicleCardsSkeleton } from "@/components/skeletons/vehicle-cards-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function VehiclesLoading() {
	return (
		<div className="p-6 md:p-8">
			<div className="mb-6 flex items-center justify-between">
				<Skeleton className="h-7 w-24" />
				<Skeleton className="h-9 w-32" />
			</div>
			<VehicleCardsSkeleton />
		</div>
	);
}
