import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import type { SortableField, SortDirection } from "../queries/get-fillups";

interface SortableColumnHeaderProps {
	label: string;
	field: SortableField;
	currentSort: SortableField;
	currentDir: SortDirection;
	searchParams: Record<string, string | undefined>;
}

export function SortableColumnHeader({
	label,
	field,
	currentSort,
	currentDir,
	searchParams,
}: SortableColumnHeaderProps) {
	const isActive = currentSort === field;
	const nextDir: SortDirection = isActive && currentDir === "asc" ? "desc" : "asc";

	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(searchParams)) {
		if (value !== undefined && key !== "sort" && key !== "dir" && key !== "page") {
			params.set(key, value);
		}
	}
	params.set("sort", field);
	params.set("dir", nextDir);

	return (
		<Link href={`/fillups?${params.toString()}`} className="inline-flex items-center gap-1 hover:text-foreground">
			{label}
			{isActive &&
				(currentDir === "asc" ? (
					<ArrowUp className="size-3.5" />
				) : (
					<ArrowDown className="size-3.5" />
				))}
		</Link>
	);
}
