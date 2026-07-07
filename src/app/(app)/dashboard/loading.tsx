import { ChartsGridSkeleton } from "@/components/skeletons/charts-grid-skeleton";
import { StatsGridSkeleton } from "@/components/skeletons/stats-grid-skeleton";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
	return (
		<div className="flex flex-col gap-6 p-6 md:p-8">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<Skeleton className="size-12 rounded-full" />
					<Skeleton className="h-7 w-32" />
				</div>
				<Skeleton className="h-16 w-40 rounded-xl" />
			</div>
			<Skeleton className="h-9 w-48 rounded-lg" />
			<StatsGridSkeleton count={8} />
			<ChartsGridSkeleton count={2} />
			<Card>
				<CardContent className="flex flex-col gap-3 pt-6">
					<Skeleton className="h-4 w-2/3" />
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<Skeleton className="h-24 w-full rounded-lg" />
						<Skeleton className="h-24 w-full rounded-lg" />
					</div>
				</CardContent>
			</Card>
			<ChartsGridSkeleton count={2} />
			<div>
				<Skeleton className="mb-3 h-6 w-40" />
				<TableSkeleton rows={5} columns={6} />
			</div>
		</div>
	);
}
