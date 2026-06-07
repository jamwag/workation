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

/** Kürzt eine Postgres-Zeit ('HH:MM:SS') auf 'HH:MM'; null -> ''. */
export function formatTime(time: string | null): string {
	return time ? time.slice(0, 5) : '';
}

/** Liste aller ISO-Tage ('YYYY-MM-DD') von start bis end (inklusive), begrenzt auf 400. */
export function eachDayISO(startISO: string, endISO: string): string[] {
	const days: string[] = [];
	const cur = new Date(`${startISO}T00:00:00Z`);
	const end = new Date(`${endISO}T00:00:00Z`);
	let guard = 0;
	while (cur <= end && guard < 400) {
		days.push(cur.toISOString().slice(0, 10));
		cur.setUTCDate(cur.getUTCDate() + 1);
		guard++;
	}
	return days;
}

/** Wochentag + Datum, z. B. 'Mo, 15.06.2026'. */
export function formatDayLong(isoDate: string): string {
	const weekday = new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('de-DE', {
		weekday: 'short',
		timeZone: 'UTC'
	});
	return `${weekday}, ${formatDate(isoDate)}`;
}
