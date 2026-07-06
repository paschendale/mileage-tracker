import { Car } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/db/schema";

// Thumbnail URLs are arbitrary user-provided links (no known set of hosts to
// allow-list), so a plain <img> is used here instead of next/image.
export function VehicleThumbnail({ vehicle, className }: { vehicle: Vehicle; className?: string }) {
	if (vehicle.thumbnailUrl) {
		return (
			// eslint-disable-next-line @next/next/no-img-element -- arbitrary user-provided URL, no host to allow-list for next/image
			<img
				src={vehicle.thumbnailUrl}
				alt={vehicle.name}
				className={cn("size-6 shrink-0 rounded-full object-cover", className)}
			/>
		);
	}

	return (
		<span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full bg-muted", className)}>
			<Car className="size-3.5 text-muted-foreground" />
		</span>
	);
}
