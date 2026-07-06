import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function FillUpsLoading() {
	return (
		<div className="p-6 md:p-8">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<Skeleton className="h-7 w-24" />
				<div className="flex items-center gap-2">
					<Skeleton className="h-9 w-full max-w-xs" />
					<Skeleton className="h-9 w-32" />
				</div>
			</div>
			<TableSkeleton rows={10} columns={9} />
		</div>
	);
}
