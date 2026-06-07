import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { requireWorkationAccess } from '$lib/server/workations';
import type { RequestHandler } from './$types';

// Liefert das Beleg-Bild aus der DB – nur für Mitglieder der Workation.
export const GET: RequestHandler = async (event) => {
	await requireWorkationAccess(event, event.params.id);

	const [row] = await db
		.select({
			image: table.expense.receiptImage,
			mime: table.expense.receiptMimeType
		})
		.from(table.expense)
		.where(
			and(
				eq(table.expense.id, event.params.expenseId),
				eq(table.expense.workationId, event.params.id)
			)
		);

	if (!row?.image) {
		error(404, 'Kein Beleg vorhanden.');
	}

	return new Response(new Uint8Array(row.image), {
		headers: {
			'Content-Type': row.mime ?? 'application/octet-stream',
			'Cache-Control': 'private, max-age=3600'
		}
	});
};
