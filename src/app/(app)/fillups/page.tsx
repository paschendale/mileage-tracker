import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FillUpsSearch } from "@/features/fillups/components/fillups-search";
import { FillUpsTable } from "@/features/fillups/components/fillups-table";
import { Pagination } from "@/features/fillups/components/pagination";
import { SORTABLE_FIELDS, getFillUpsPage, type SortableField } from "@/features/fillups/queries/get-fillups";
import { getSelectedVehicleId } from "@/lib/selected-vehicle";

function isSortableField(value: string | undefined): value is SortableField {
	return SORTABLE_FIELDS.includes(value as SortableField);
}

interface FillUpsPageProps {
	searchParams: Promise<Record<string, string | undefined>>;
}

export default async function FillUpsPage({ searchParams }: FillUpsPageProps) {
	const params = await searchParams;
	const vehicleId = await getSelectedVehicleId();

	const sort = isSortableField(params.sort) ? params.sort : "date";
	const dir = params.dir === "asc" ? "asc" : "desc";
	const page = Number(params.page) || 1;
	const query = params.q ?? "";

	const result = vehicleId
		? await getFillUpsPage(vehicleId, { query, sort, dir, page })
		: { items: [], page: 1, pageSize: 15, totalItems: 0, totalPages: 1 };

	return (
		<div className="p-6 md:p-8">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<h1 className="text-2xl font-semibold tracking-tight">Fill-ups</h1>
				<div className="flex items-center gap-2">
					<FillUpsSearch defaultValue={query} />
					<Button
						nativeButton={false}
						render={
							<Link href="/fillups/new">
								<Plus className="size-4" />
								Add fill-up
							</Link>
						}
					/>
				</div>
			</div>

			{vehicleId === null ? (
				<div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-24 text-center">
					<p className="font-medium">No vehicles yet</p>
					<p className="text-sm text-muted-foreground">Add a vehicle before logging fill-ups.</p>
				</div>
			) : (
				<>
					<FillUpsTable rows={result.items} sort={sort} dir={dir} searchParams={params} />
					<Pagination page={result.page} totalPages={result.totalPages} searchParams={params} />
				</>
			)}
		</div>
	);
}
