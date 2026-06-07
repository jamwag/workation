import { error, fail } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { requireWorkationAccess } from '$lib/server/workations';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	// Zugriff via +layout.server.ts gesichert.
	const entries = await db
		.select()
		.from(table.scheduleEntry)
		.where(eq(table.scheduleEntry.workationId, event.params.id))
		.orderBy(asc(table.scheduleEntry.day), asc(table.scheduleEntry.startTime));
	return { entries };
};

const TIME_RE = /^\d{2}:\d{2}$/;

export const actions: Actions = {
	add: async (event) => {
		const { workation, isManager } = await requireWorkationAccess(event, event.params.id);
		if (!isManager) {
			error(403, 'Nur der Ersteller darf den Tagesplan bearbeiten.');
		}

		const fd = await event.request.formData();
		const day = (fd.get('day') ?? '').toString();
		const title = (fd.get('title') ?? '').toString().trim();
		const startTime = (fd.get('startTime') ?? '').toString();
		const endTime = (fd.get('endTime') ?? '').toString();
		const description = (fd.get('description') ?? '').toString().trim();

		if (!title) {
			return fail(400, { message: 'Bitte einen Titel angeben.' });
		}
		// Tag muss im Workation-Zeitraum liegen (ISO-Strings sind chronologisch vergleichbar).
		if (day < workation.startDate || day > workation.endDate) {
			return fail(400, { message: 'Der Tag liegt außerhalb des Workation-Zeitraums.' });
		}
		if (startTime && !TIME_RE.test(startTime)) {
			return fail(400, { message: 'Ungültige Startzeit.' });
		}
		if (endTime && !TIME_RE.test(endTime)) {
			return fail(400, { message: 'Ungültige Endzeit.' });
		}
		if (startTime && endTime && endTime < startTime) {
			return fail(400, { message: 'Die Endzeit darf nicht vor der Startzeit liegen.' });
		}

		await db.insert(table.scheduleEntry).values({
			workationId: workation.id,
			day,
			title,
			startTime: startTime || null,
			endTime: endTime || null,
			description: description || null
		});
		return { added: true };
	},

	delete: async (event) => {
		const { workation, isManager } = await requireWorkationAccess(event, event.params.id);
		if (!isManager) {
			error(403, 'Nur der Ersteller darf den Tagesplan bearbeiten.');
		}
		const fd = await event.request.formData();
		const entryId = (fd.get('entryId') ?? '').toString();
		if (!entryId) {
			return fail(400);
		}
		await db
			.delete(table.scheduleEntry)
			.where(
				and(
					eq(table.scheduleEntry.id, entryId),
					eq(table.scheduleEntry.workationId, workation.id)
				)
			);
		return { ok: true };
	}
};
