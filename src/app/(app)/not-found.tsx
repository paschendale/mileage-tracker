import { Compass } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppNotFound() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
			<div className="flex size-12 items-center justify-center rounded-full bg-muted">
				<Compass className="size-6 text-muted-foreground" />
			</div>
			<p className="font-medium">Page not found</p>
			<p className="max-w-sm text-sm text-muted-foreground">
				The page you&apos;re looking for doesn&apos;t exist or may have been removed.
			</p>
			<Button nativeButton={false} render={<Link href="/dashboard">Back to Dashboard</Link>} />
		</div>
	);
}
