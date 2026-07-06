"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
			<div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
				<AlertTriangle className="size-6 text-destructive" />
			</div>
			<p className="font-medium">Something went wrong</p>
			<p className="max-w-sm text-sm text-muted-foreground">
				An unexpected error occurred while loading this page. You can try again.
			</p>
			<Button onClick={() => reset()}>Try again</Button>
		</div>
	);
}
