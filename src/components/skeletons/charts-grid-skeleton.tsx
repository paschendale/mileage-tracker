import { Skeleton } from "@/components/ui/skeleton";

export function ChartsGridSkeleton({ count = 4 }: { count?: number }) {
	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			{Array.from({ length: count }).map((_, i) => (
				<Skeleton key={i} className="h-[21.5rem] w-full rounded-xl" />
			))}
		</div>
	);
}
