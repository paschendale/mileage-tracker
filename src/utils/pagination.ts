export interface PaginatedResult<T> {
	items: T[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

export function paginate<T>(items: readonly T[], page: number, pageSize: number): PaginatedResult<T> {
	const totalItems = items.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const safePage = Math.min(Math.max(1, page), totalPages);
	const start = (safePage - 1) * pageSize;

	return {
		items: items.slice(start, start + pageSize),
		page: safePage,
		pageSize,
		totalItems,
		totalPages,
	};
}
