import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
	icon: Icon,
	title,
	description,
	compact = false,
}: {
	icon: LucideIcon;
	title: string;
	description: string;
	compact?: boolean;
}) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center",
				compact ? "py-16" : "py-24",
			)}
		>
			<div className="mb-1 flex size-12 items-center justify-center rounded-full bg-primary/10">
				<Icon className="size-6 text-primary" />
			</div>
			<p className="font-medium">{title}</p>
			<p className="text-sm text-muted-foreground">{description}</p>
		</div>
	);
}
