import { StatsGridSkeleton } from "@/components/skeletons/stats-grid-skeleton";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatisticsLoading() {
	return (
		<div className="flex flex-col gap-6 p-6 md:p-8">
			<Skeleton className="h-7 w-32" />
			<StatsGridSkeleton />
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<div>
					<Skeleton className="mb-3 h-6 w-36" />
					<TableSkeleton rows={6} columns={2} />
				</div>
				<div>
					<Skeleton className="mb-3 h-6 w-32" />
					<TableSkeleton rows={3} columns={2} />
				</div>
			</div>
		</div>
	);
}
