import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PaginationProps {
	page: number;
	totalPages: number;
	searchParams: Record<string, string | undefined>;
}

export function Pagination({ page, totalPages, searchParams }: PaginationProps) {
	if (totalPages <= 1) return null;

	function hrefFor(targetPage: number) {
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(searchParams)) {
			if (value !== undefined && key !== "page") {
				params.set(key, value);
			}
		}
		params.set("page", String(targetPage));
		return `/fillups?${params.toString()}`;
	}

	return (
		<div className="flex items-center justify-between pt-4">
			<p className="text-sm text-muted-foreground">
				Page {page} of {totalPages}
			</p>
			<div className="flex gap-2">
				{page <= 1 ? (
					<Button variant="outline" size="sm" disabled>
						<ChevronLeft className="size-4" />
						Previous
					</Button>
				) : (
					<Button
						variant="outline"
						size="sm"
						nativeButton={false}
						render={
							<Link href={hrefFor(page - 1)}>
								<ChevronLeft className="size-4" />
								Previous
							</Link>
						}
					/>
				)}
				{page >= totalPages ? (
					<Button variant="outline" size="sm" disabled>
						Next
						<ChevronRight className="size-4" />
					</Button>
				) : (
					<Button
						variant="outline"
						size="sm"
						nativeButton={false}
						render={
							<Link href={hrefFor(page + 1)}>
								Next
								<ChevronRight className="size-4" />
							</Link>
						}
					/>
				)}
			</div>
		</div>
	);
}
