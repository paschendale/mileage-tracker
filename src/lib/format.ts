import { format, parse } from "date-fns";

export function formatCurrency(value: number): string {
	return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
	return new Intl.NumberFormat("pt-BR", options).format(value);
}

const ISO_DATE_FORMAT = "yyyy-MM-dd";

/** Formats a plain 'YYYY-MM-DD' date string for display, e.g. "07 jul 2026". */
export function formatDateDisplay(isoDate: string): string {
	return format(parse(isoDate, ISO_DATE_FORMAT, new Date()), "dd MMM yyyy");
}

export function dateToIsoString(date: Date): string {
	return format(date, ISO_DATE_FORMAT);
}

export function isoStringToDate(isoDate: string): Date {
	return parse(isoDate, ISO_DATE_FORMAT, new Date());
}
