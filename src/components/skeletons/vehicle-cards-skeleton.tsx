import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function VehicleCardsSkeleton({ count = 4 }: { count?: number }) {
	return (
		<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
			{Array.from({ length: count }).map((_, i) => (
				<Card key={i}>
					<CardContent className="flex flex-col items-center gap-3 py-8">
						<Skeleton className="size-16 rounded-full" />
						<div className="flex flex-col items-center gap-1.5">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-3 w-16" />
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
