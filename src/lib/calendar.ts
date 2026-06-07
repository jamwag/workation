/** Monate (year, month – 0-basiert), die der Zeitraum berührt. */
export function monthsInRange(startISO: string, endISO: string): { year: number; month: number }[] {
	const months: { year: number; month: number }[] = [];
	const start = new Date(`${startISO}T00:00:00Z`);
	const end = new Date(`${endISO}T00:00:00Z`);
	let y = start.getUTCFullYear();
	let m = start.getUTCMonth();
	const endY = end.getUTCFullYear();
	const endM = end.getUTCMonth();
	let guard = 0;
	while ((y < endY || (y === endY && m <= endM)) && guard < 60) {
		months.push({ year: y, month: m });
		m += 1;
		if (m > 11) {
			m = 0;
			y += 1;
		}
		guard += 1;
	}
	return months;
}

/** 7-Spalten-Wochenmatrix (Mo-startend) für einen Monat; null = Tag außerhalb des Monats. */
export function monthMatrix(year: number, month: number): (string | null)[][] {
	const first = new Date(Date.UTC(year, month, 1));
	const firstWeekday = (first.getUTCDay() + 6) % 7; // Mo=0 … So=6
	const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

	const cells: (string | null)[] = [];
	for (let i = 0; i < firstWeekday; i++) cells.push(null);
	for (let d = 1; d <= daysInMonth; d++) {
		cells.push(
			`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
		);
	}
	while (cells.length % 7 !== 0) cells.push(null);

	const weeks: (string | null)[][] = [];
	for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
	return weeks;
}

/** Monatsname + Jahr, z. B. „Juni 2026". */
export function monthLabel(year: number, month: number): string {
	return new Date(Date.UTC(year, month, 1)).toLocaleDateString('de-DE', {
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	});
}

/** Tag aus einem ISO-Datum ('YYYY-MM-DD' -> 15). */
export function dayOfMonth(iso: string): number {
	return Number(iso.slice(8, 10));
}
