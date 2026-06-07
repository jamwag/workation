/** Formatiert ein ISO-Datum ('YYYY-MM-DD') als 'DD.MM.YYYY'. */
export function formatDate(isoDate: string): string {
	const [y, m, d] = isoDate.split('-');
	return `${d}.${m}.${y}`;
}

export function formatDateRange(start: string, end: string): string {
	return `${formatDate(start)} – ${formatDate(end)}`;
}

/** Formatiert einen Centbetrag als lokalisierte Währung. */
export function formatMoney(cents: number, currency = 'EUR'): string {
	return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(cents / 100);
}
