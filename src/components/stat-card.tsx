import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
	label,
	value,
	hint,
	className,
}: {
	label: string;
	value: string;
	hint?: string;
	className?: string;
}) {
	return (
		<Card className={cn("gap-1 py-4", className)}>
			<CardContent className="flex flex-col gap-1 px-4">
				<p className="text-xs font-medium text-muted-foreground">{label}</p>
				<p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
				{hint && <p className="text-xs text-muted-foreground">{hint}</p>}
			</CardContent>
		</Card>
	);
}
