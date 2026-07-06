import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
			</CardHeader>
			<CardContent className="h-64">{children}</CardContent>
		</Card>
	);
}
