import { ChartsGridSkeleton } from "@/components/skeletons/charts-grid-skeleton";
import { StatsGridSkeleton } from "@/components/skeletons/stats-grid-skeleton";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
	return (
		<div className="flex flex-col gap-6 p-6 md:p-8">
			<div className="flex items-center gap-3">
				<Skeleton className="size-12 rounded-full" />
				<Skeleton className="h-7 w-32" />
			</div>
			<StatsGridSkeleton />
			<ChartsGridSkeleton />
			<div>
				<Skeleton className="mb-3 h-6 w-40" />
				<TableSkeleton rows={5} columns={6} />
			</div>
		</div>
	);
}
