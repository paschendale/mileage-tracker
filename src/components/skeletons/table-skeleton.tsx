import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 8, columns = 6 }: { rows?: number; columns?: number }) {
	return (
		<div className="overflow-hidden rounded-xl border">
			<div className="flex items-center gap-4 border-b bg-muted/30 px-4 py-3">
				{Array.from({ length: columns }).map((_, i) => (
					<Skeleton key={i} className="h-3 flex-1" />
				))}
			</div>
			{Array.from({ length: rows }).map((_, row) => (
				<div key={row} className="flex items-center gap-4 border-b px-4 py-3.5 last:border-b-0">
					{Array.from({ length: columns }).map((_, col) => (
						<Skeleton key={col} className="h-4 flex-1" />
					))}
				</div>
			))}
		</div>
	);
}
