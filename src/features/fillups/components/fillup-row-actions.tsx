"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteFillUpAlert } from "./delete-fillup-alert";

export function FillUpRowActions({ fillUpId }: { fillUpId: number }) {
	const [deleteOpen, setDeleteOpen] = useState(false);

	return (
		<div className="flex justify-end gap-1">
			<Button
				variant="ghost"
				size="icon-sm"
				nativeButton={false}
				render={
					<Link href={`/fillups/${fillUpId}/edit`}>
						<Pencil className="size-3.5" />
						<span className="sr-only">Edit</span>
					</Link>
				}
			/>
			<Button variant="ghost" size="icon-sm" onClick={() => setDeleteOpen(true)}>
				<Trash2 className="size-3.5" />
				<span className="sr-only">Delete</span>
			</Button>
			<DeleteFillUpAlert fillUpId={fillUpId} open={deleteOpen} onOpenChange={setDeleteOpen} />
		</div>
	);
}
