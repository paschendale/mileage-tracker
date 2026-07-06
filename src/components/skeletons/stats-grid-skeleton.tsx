import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsGridSkeleton({ count = 9 }: { count?: number }) {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			{Array.from({ length: count }).map((_, i) => (
				<Card key={i} className="gap-1 py-4">
					<CardContent className="flex flex-col gap-2 px-4">
						<Skeleton className="h-3 w-20" />
						<Skeleton className="h-6 w-16" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}
