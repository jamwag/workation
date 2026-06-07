/**
 * Teilt einen Centbetrag möglichst gleichmäßig auf n Teile auf.
 * Der Rundungsrest wird cent-weise auf die ersten Teile verteilt,
 * sodass die Summe der Teile exakt dem Gesamtbetrag entspricht.
 */
export function splitAmountCents(totalCents: number, n: number): number[] {
	if (n <= 0) return [];
	const base = Math.floor(totalCents / n);
	const remainder = totalCents - base * n;
	return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0));
}

/** Baut einen PayPal.me-Link mit optional vorausgefülltem Betrag (in Cent). */
export function paypalMeLink(handle: string, amountCents?: number, currency = 'EUR'): string {
	const base = `https://paypal.me/${encodeURIComponent(handle)}`;
	if (amountCents == null) return base;
	return `${base}/${(amountCents / 100).toFixed(2)}${currency}`;
}
