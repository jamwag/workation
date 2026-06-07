import { error, fail } from '@sveltejs/kit';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { requireWorkationAccess } from '$lib/server/workations';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { workation, isManager } = await requireWorkationAccess(event, event.params.id);

	const members = await db
		.select({
			memberId: table.workationMember.id,
			userId: table.user.id,
			username: table.user.username,
			status: table.workationMember.status
		})
		.from(table.workationMember)
		.innerJoin(table.user, eq(table.workationMember.userId, table.user.id))
		.where(eq(table.workationMember.workationId, workation.id))
		.orderBy(table.user.username);

	return { workation, members, isManager };
};

export const actions: Actions = {
	invite: async (event) => {
		const { workation, isManager } = await requireWorkationAccess(event, event.params.id);
		if (!isManager) {
			error(403, 'Nur der Ersteller darf einladen.');
		}

		const formData = await event.request.formData();
		const username = (formData.get('username') ?? '').toString().trim().toLowerCase();
		if (!username) {
			return fail(400, { message: 'Bitte einen Benutzernamen angeben.' });
		}

		const [invitee] = await db
			.select({ id: table.user.id })
			.from(table.user)
			.where(eq(table.user.username, username));
		if (!invitee) {
			return fail(400, { message: `Kein Nutzer „${username}" gefunden.` });
		}

		try {
			await db.insert(table.workationMember).values({
				workationId: workation.id,
				userId: invitee.id,
				status: 'invited'
			});
		} catch {
			return fail(400, { message: 'Dieser Nutzer ist bereits eingeladen oder Mitglied.' });
		}
		return { invited: username };
	},

	remove: async (event) => {
		const { workation, isManager } = await requireWorkationAccess(event, event.params.id);
		if (!isManager) {
			error(403, 'Nur der Ersteller darf Mitglieder entfernen.');
		}

		const formData = await event.request.formData();
		const memberId = (formData.get('memberId') ?? '').toString();
		if (!memberId) {
			return fail(400);
		}
		// Der Ersteller kann sich nicht selbst entfernen.
		await db
			.delete(table.workationMember)
			.where(
				and(
					eq(table.workationMember.id, memberId),
					eq(table.workationMember.workationId, workation.id),
					ne(table.workationMember.userId, workation.createdById)
				)
			);
		return { ok: true };
	}
};
