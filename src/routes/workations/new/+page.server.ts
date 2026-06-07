import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/auth-guard';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		const user = requireAdmin(event);
		const formData = await event.request.formData();
		const name = (formData.get('name') ?? '').toString().trim();
		const startDate = (formData.get('startDate') ?? '').toString();
		const endDate = (formData.get('endDate') ?? '').toString();
		const values = { name, startDate, endDate };

		if (name.length < 1 || name.length > 100) {
			return fail(400, { message: 'Bitte einen Namen (1–100 Zeichen) angeben.', values });
		}
		const dateRe = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRe.test(startDate) || !dateRe.test(endDate)) {
			return fail(400, { message: 'Bitte gültige Start- und Enddaten wählen.', values });
		}
		// ISO-Datumsstrings sind lexikografisch chronologisch vergleichbar.
		if (startDate > endDate) {
			return fail(400, { message: 'Das Enddatum darf nicht vor dem Startdatum liegen.', values });
		}

		const [created] = await db
			.insert(table.workation)
			.values({ name, startDate, endDate, createdById: user.id })
			.returning({ id: table.workation.id });

		// Ersteller direkt als akzeptiertes Mitglied aufnehmen.
		await db.insert(table.workationMember).values({
			workationId: created.id,
			userId: user.id,
			status: 'accepted'
		});

		redirect(303, `/workations/${created.id}`);
	}
};
