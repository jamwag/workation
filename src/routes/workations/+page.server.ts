import { fail, type RequestEvent } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { requireLogin } from '$lib/server/auth-guard';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = requireLogin(event);

	const memberships = await db
		.select({
			memberId: table.workationMember.id,
			status: table.workationMember.status,
			workation: table.workation
		})
		.from(table.workationMember)
		.innerJoin(table.workation, eq(table.workationMember.workationId, table.workation.id))
		.where(eq(table.workationMember.userId, user.id))
		.orderBy(table.workation.startDate);

	return {
		active: memberships.filter((m) => m.status === 'accepted'),
		invitations: memberships.filter((m) => m.status === 'invited'),
		isAdmin: user.role === 'admin'
	};
};

async function respondToInvitation(event: RequestEvent, status: 'accepted' | 'declined') {
	const user = requireLogin(event);
	const formData = await event.request.formData();
	const memberId = formData.get('memberId');
	if (typeof memberId !== 'string') {
		return fail(400);
	}
	// where filtert auf userId -> man kann nur die eigenen Einladungen beantworten.
	await db
		.update(table.workationMember)
		.set({ status })
		.where(and(eq(table.workationMember.id, memberId), eq(table.workationMember.userId, user.id)));
	return { ok: true };
}

export const actions: Actions = {
	accept: (event) => respondToInvitation(event, 'accepted'),
	decline: (event) => respondToInvitation(event, 'declined')
};
