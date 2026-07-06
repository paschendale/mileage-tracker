"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<html lang="en">
			<body>
				<div className="flex min-h-svh flex-col items-center justify-center gap-3 p-8 text-center font-sans">
					<p className="text-lg font-medium">Something went wrong</p>
					<p className="max-w-sm text-sm text-neutral-500">
						An unexpected error occurred. You can try again.
					</p>
					<button
						type="button"
						onClick={() => reset()}
						className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
					>
						Try again
					</button>
				</div>
			</body>
		</html>
	);
}
