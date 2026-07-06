"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export function FillUpsSearch({ defaultValue }: { defaultValue: string }) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [value, setValue] = useState(defaultValue);
	const debounced = useDebouncedValue(value, 300);

	useEffect(() => {
		const params = new URLSearchParams(searchParams.toString());
		if (debounced) {
			params.set("q", debounced);
		} else {
			params.delete("q");
		}
		params.delete("page");

		const query = params.toString();
		router.push(query ? `${pathname}?${query}` : pathname);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the debounced search text changes, not on every searchParams identity change
	}, [debounced]);

	return (
		<div className="relative w-full max-w-xs">
			<Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				value={value}
				onChange={(e) => setValue(e.target.value)}
				placeholder="Search fill-ups…"
				className="pl-8"
			/>
		</div>
	);
}
