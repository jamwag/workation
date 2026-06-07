import { error, type RequestEvent } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { requireLogin } from '$lib/server/auth-guard';

/**
 * Lädt eine Workation und stellt sicher, dass der angemeldete Nutzer Zugriff hat
 * (akzeptiertes Mitglied oder Ersteller). `isManager` gilt nur für den Ersteller –
 * er darf einladen, Mitglieder entfernen und den Tagesplan bearbeiten.
 */
export async function requireWorkationAccess(event: RequestEvent, workationId: string) {
	const user = requireLogin(event);

	const [workation] = await db
		.select()
		.from(table.workation)
		.where(eq(table.workation.id, workationId));
	if (!workation) {
		error(404, 'Workation nicht gefunden.');
	}

	const [membership] = await db
		.select()
		.from(table.workationMember)
		.where(
			and(
				eq(table.workationMember.workationId, workationId),
				eq(table.workationMember.userId, user.id)
			)
		);

	const isCreator = workation.createdById === user.id;
	const isMember = membership?.status === 'accepted';
	if (!isCreator && !isMember) {
		error(403, 'Du hast keinen Zugriff auf diese Workation.');
	}

	return { user, workation, membership, isManager: isCreator };
}
